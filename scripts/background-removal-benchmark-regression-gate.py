#!/usr/bin/env python3
import argparse, json
from pathlib import Path

def flatten(prefix,obj,out):
    if isinstance(obj,dict):
        for k,v in obj.items(): flatten(f'{prefix}.{k}' if prefix else k,v,out)
    elif isinstance(obj,(int,float)) and not isinstance(obj,bool): out[prefix]=float(obj)

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('baseline'); ap.add_argument('candidate'); ap.add_argument('--policy',required=True); a=ap.parse_args()
    base={}; cand={}; flatten('',json.loads(Path(a.baseline).read_text()),base); flatten('',json.loads(Path(a.candidate).read_text()),cand)
    policy=json.loads(Path(a.policy).read_text()); failures=[]; checked=[]
    for rule in policy.get('rules',[]):
        metric=rule['metric']; direction=rule.get('direction','higher'); max_reg=float(rule.get('max_regression',0))
        if metric not in base or metric not in cand:
            if rule.get('required',True): failures.append(f'missing metric: {metric}')
            continue
        b,c=base[metric],cand[metric]; regression=(b-c) if direction=='higher' else (c-b)
        checked.append({'metric':metric,'baseline':b,'candidate':c,'regression':regression,'max_regression':max_reg})
        if regression>max_reg: failures.append(f'{metric}: regression {regression:.6f} > {max_reg:.6f}')
    print(json.dumps({'ok':not failures,'checked':checked,'failures':failures},indent=2))
    raise SystemExit(1 if failures else 0)
if __name__=='__main__': main()
