#!/usr/bin/env python3
import argparse, json, time
from pathlib import Path

def load(p): return json.loads(Path(p).read_text())
def save(p,o): Path(p).write_text(json.dumps(o,indent=2,sort_keys=True)+'\n')
def approved(reg,name):
    return next((m for m in reg.get('models',[]) if m.get('name')==name and m.get('production_approved')),None)
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('state'); ap.add_argument('registry'); sub=ap.add_subparsers(dest='cmd',required=True)
    sub.add_parser('status'); c=sub.add_parser('set-candidate'); c.add_argument('model'); c.add_argument('--traffic-percent',type=float,default=0); c.add_argument('--shadow',action='store_true'); sub.add_parser('promote'); sub.add_parser('rollback')
    a=ap.parse_args(); st=load(a.state); reg=load(a.registry)
    if a.cmd=='set-candidate':
        if not approved(reg,a.model): raise SystemExit('candidate is not production_approved in model registry')
        if not 0<=a.traffic_percent<=100: raise SystemExit('traffic percent must be 0..100')
        st['candidate_model']=a.model; st['candidate_traffic_percent']=a.traffic_percent; st['shadow_mode']=bool(a.shadow); st['updated_unix']=int(time.time())
    elif a.cmd=='promote':
        cand=st.get('candidate_model')
        if not cand or not approved(reg,cand): raise SystemExit('no approved candidate')
        st['rollback_model']=st.get('stable_model'); st['stable_model']=cand; st['candidate_model']=None; st['candidate_traffic_percent']=0; st['shadow_mode']=True; st['updated_unix']=int(time.time())
    elif a.cmd=='rollback':
        rb=st.get('rollback_model')
        if not rb: raise SystemExit('no rollback model recorded')
        st['candidate_model']=st.get('stable_model'); st['stable_model']=rb; st['candidate_traffic_percent']=0; st['shadow_mode']=True; st['updated_unix']=int(time.time())
    if a.cmd!='status': save(a.state,st)
    print(json.dumps(st,indent=2,sort_keys=True))
if __name__=='__main__': main()
