import sys
p = r"c:\Users\user\Downloads\Regaarder-4.0-main\Regaarder-4.0-main\src\ideas.jsx"
with open(p,'r',encoding='utf-8') as f:
    s = f.read()

line = 1
in_s = in_d = in_t = in_line = in_block = False
esc = False
balance = 0
open_stack = []

i = 0
L = len(s)
while i < L:
    ch = s[i]
    if ch == '\n':
        line += 1
        in_line = False
        esc = False
        i += 1
        continue

    if in_line:
        i += 1
        continue
    if in_block:
        if ch == '*' and i+1 < L and s[i+1] == '/':
            in_block = False
            i += 2
            continue
        i += 1
        continue
    if esc:
        esc = False
        i += 1
        continue
    if ch == '\\':
        esc = True
        i += 1
        continue
    if in_s:
        if ch == "'":
            in_s = False
        i += 1
        continue
    if in_d:
        if ch == '"':
            in_d = False
        i += 1
        continue
    # when inside template literal, we still want to count { and } that are part of ${...}
    if in_t:
        if ch == '`':
            in_t = False
            i += 1
            continue
        # detect ${ and treat the following { as a real brace (do not skip processing braces)
        if ch == '$' and i+1 < L and s[i+1] == '{':
            balance += 1
            open_stack.append((line, i))
            i += 2
            continue
        # otherwise, move on but still allow braces to be processed below

    # not in any string/comment (or inside template literal but not in ${})
    if ch == '/':
        if i+1 < L and s[i+1] == '/':
            in_line = True
            i += 2
            continue
        if i+1 < L and s[i+1] == '*':
            in_block = True
            i += 2
            continue
    if ch == "'":
        in_s = True
        i += 1
        continue
    if ch == '"':
        in_d = True
        i += 1
        continue
    if ch == '`':
        in_t = True
        i += 1
        continue
    if ch == '{':
        balance += 1
        open_stack.append((line, i))
    elif ch == '}':
        if balance > 0:
            balance -= 1
            open_stack.pop()
        else:
            print('Extra closing brace at line', line)

print('Final balance:',balance)
if balance>0:
    print('Top unclosed at line',open_stack[-1][0] if open_stack else 'unknown')
    print('Last 10 unclosed lines:', [ln for (ln,_) in open_stack[-10:]])
    # print context for last unclosed
    ul = open_stack[-1][0]
    all_lines = s.splitlines()
    start = max(0, ul-4)
    end = min(len(all_lines), ul+2)
    print('\nContext around unclosed line %d:'%ul)
    for idx in range(start,end):
        print(f"{idx+1:5d}: {all_lines[idx]}")
else:
    print('No unclosed braces found.')

# Additional diagnostics: backtick counts and locations
bt_positions = [i for i,ch in enumerate(s) if ch=='`']
print('Backticks total:', len(bt_positions))
if bt_positions:
    # convert to line numbers
    lines = s.splitlines()
    acc = 0
    positions_lines = []
    for idx,line in enumerate(lines, start=1):
        acc += len(line)+1
        # find backticks in this line
        if any(pos < acc and pos >= acc - (len(line)+1) for pos in bt_positions):
            positions_lines.append(idx)
    print('Backtick lines (first 10):', positions_lines[:10])
