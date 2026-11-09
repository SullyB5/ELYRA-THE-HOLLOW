"""Pull every spoken line out of ELYRA's scripts: each speaker literal, the argument after it, every branch of a ternary,
pick([...]) pools, arrow-function lines, and the per-file shorthand speakers. Lines with a variable part come out as
templates with {holes}; expand.py fills them."""
import re, os, json, sys
root = sys.argv[1]
SPK = ["Captain Rhen · recording","Captain Rhen?","Captain Rhen","Elias Veyr","Lt. Michael","Thorne (stolen radio)","Thorne",
       "Ensign Landry","Sergeant Marsh","Tide City Command","Okafor","Keeper Sergeant","ELYRA","The Hollow King","Covenant Command",
       "Dropship Two","Dropship Mercy","Vigil crew","Host speaker","Host officer","Fleet Engineer","Warden Six","Herald transport",
       "Herald broadcast"]
ALIAS = {'js/shared/prologue.js': {'E': 'Elias Veyr', 'M': 'Lt. Michael'}}
CALLS = {'js/menu/footage.js': {'M': 'Lt. Michael', 'E': 'ELYRA'}}

TOK = re.compile(r"""\s+|//[^\n]*|/\*.*?\*/|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\.|[A-Za-z_$][\w$]*|\d+\.?\d*|\.\d+|.""", re.S)
def tokens(s):
    out = []
    for m in TOK.finditer(s):
        t = m.group(0)
        if t.isspace() or t.startswith('//') or t.startswith('/*'): continue
        out.append((t, m.start()))
    return out
def unq(t):
    b = t[1:-1]
    return re.sub(r"\\(.)", lambda m: {'n': ' '}.get(m.group(1), m.group(1)), b)
isstr = lambda t: t[:1] in "'\"`" and len(t) >= 2

OPEN = {'(': ')', '[': ']', '{': '}'}
def match(T, i):
    """index of the bracket closing T[i]"""
    d = 0
    for j in range(i, len(T)):
        if T[j][0] in OPEN: d += 1
        elif T[j][0] in ')]}':
            d -= 1
            if d == 0: return j
    return len(T) - 1
def arg_end(T, i):
    """end (exclusive) of the expression starting at i: next top-level , or a closer"""
    j = i
    while j < len(T):
        t = T[j][0]
        if t in OPEN: j = match(T, j) + 1; continue
        if t in ',)]};': return j
        j += 1
    return j

def src(T): return ' '.join(t for t, _ in T)

def alts(T):
    """every string this expression can produce; holes as {expr}"""
    if not T: return []
    # an arrow function: its returned value(s)
    if len(T) >= 3 and T[0][0] == '(' and T[1][0] == ')' and T[2][0] == '=>':
        body = T[3:]
        if body and body[0][0] == '{':
            out = []
            for k in range(len(body)):
                if body[k][0] == 'return':
                    e = arg_end(body, k + 1); out += alts(body[k + 1:e])
            return out
        return alts(body)
    # top-level ternary
    d = 0; q = None
    for k, (t, _) in enumerate(T):
        if t in OPEN: d += 1
        elif t in ')]}': d -= 1
        elif t == '?' and d == 0: q = k; break
    if q is not None:
        d = 0; n = 0
        for k in range(q + 1, len(T)):
            t = T[k][0]
            if t in OPEN: d += 1
            elif t in ')]}': d -= 1
            elif d == 0 and t == '?': n += 1
            elif d == 0 and t == ':':
                if n == 0: return alts(T[q + 1:k]) + alts(T[k + 1:])
                n -= 1
        return alts(T[q + 1:])
    return concat(T)

def concat(T):
    parts = []; d = 0; cur = []
    for t in T:
        if t[0] in OPEN: d += 1
        elif t[0] in ')]}': d -= 1
        if t[0] == '+' and d == 0: parts.append(cur); cur = []
        else: cur.append(t)
    parts.append(cur)
    res = ['']
    for p in parts:
        if not p: continue
        if len(p) == 1 and isstr(p[0][0]):
            v = unq(p[0][0]); v = re.sub(r"\$\{([^}]*)\}", r"{\1}", v) if p[0][0][0] == '`' else v; opts = [v]
        elif p[0][0] == '(' and match(p, 0) == len(p) - 1: opts = alts(p[1:-1]) or ['{' + src(p) + '}']
        elif p[0][0] == 'pick' and len(p) > 2 and p[1][0] == '(' and p[2][0] == '[':
            inner = p[3:match(p, 2)]; opts = []; k = 0
            while k < len(inner):
                e = arg_end(inner, k); opts += alts(inner[k:e]); k = e + 1
        else: opts = ['{' + src(p) + '}']
        res = [a + b for a in res for b in opts]
    return res

def tone_after(T, e):
    if e < len(T) and T[e][0] == ',' and e + 1 < len(T) and isstr(T[e + 1][0]): return unq(T[e + 1][0])
    return None

lines = []
def add(who, texts, tone, f, pos, s):
    for t in texts:
        if not t or not re.search(r'[A-Za-z]', t) or len(t) < 2: continue
        lines.append(dict(who=who, text=t, tone=tone, file=f, line=s.count('\n', 0, pos) + 1, hole='{' in t))

for dp, dn, fn in os.walk(os.path.join(root, 'js')):
    for name in fn:
        if not name.endswith('.js'): continue
        p = os.path.join(dp, name); f = os.path.relpath(p, root); s = open(p, encoding='utf8').read(); T = tokens(s)
        al = ALIAS.get(f, {}); ca = CALLS.get(f, {})
        for i, (t, pos) in enumerate(T):
            who = None
            if isstr(t) and unq(t) in SPK: who = [unq(t)]
            elif t in al and i + 1 < len(T) and T[i + 1][0] == ',' and i > 0 and T[i - 1][0] in '[,': who = [al[t]]
            elif t in ca and i + 1 < len(T) and T[i + 1][0] == '(' and (i == 0 or T[i - 1][0] not in ('.', 'const', 'function')):
                e = arg_end(T, i + 2); add(ca[t], alts(T[i + 2:e]), tone_after(T, e), f, pos, s); continue
            if not who: continue
            # part of a speaker ternary already handled by its first literal
            if i >= 2 and T[i - 1][0] == ':' and isstr(T[i - 2][0]) and unq(T[i - 2][0]) in SPK: continue
            j = i + 1
            while j + 1 < len(T) and T[j][0] == ':' and isstr(T[j + 1][0]) and unq(T[j + 1][0]) in SPK:
                who.append(unq(T[j + 1][0])); j += 2
            if j >= len(T) or T[j][0] != ',': continue
            k = j + 1
            if k >= len(T): continue
            # keys, maps and labels, not lines: 'Thorne',pitch:...  {who:'X'}  'X':{...}
            if T[k][0] in ('{',) or (k + 1 < len(T) and T[k + 1][0] == ':' and not isstr(T[k][0])): continue
            e = arg_end(T, k)
            texts = alts(T[k:e]); tone = tone_after(T, e)
            for w in who: add(w, texts, tone, f, pos, s)

# the menu's signal secrets (js/menu/secrets.js): two voice pools
for t in ['You are already there.', 'Michael is not finished.', 'Do not use the Spear.']:
    lines.append(dict(who='ELYRA', text=t, tone='human', file='js/menu/secrets.js', line=83, hole=False))
for t in ['Michael.', 'Is anybody receiving.', 'They are not invading us.', 'Michael. Do not open it.']:
    lines.append(dict(who='Captain Rhen', text=t, tone='echo', file='js/menu/secrets.js', line=83, hole=False))

json.dump(lines, open('/home/claude/voicework/lines2.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(lines), 'raw;', len({(l['who'], l['text'], l['tone']) for l in lines}), 'unique;', sum(l['hole'] for l in lines), 'with holes')
print(Counter(l['who'] for l in lines).most_common())
print(Counter(l['tone'] for l in lines).most_common())
