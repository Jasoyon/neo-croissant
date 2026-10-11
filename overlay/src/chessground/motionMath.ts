// Parameters verified in Chess.com board 1.187.1, kke/jke/Uie.
export const zeroRotation=()=>({newRotation:0,targetRotation:0,lastSpeed:0,overshootApplied:false});
export function pickupScale(elapsedMs:number){
  if(elapsedMs>=200)return 1;
  const t=Math.max(0,elapsedMs)/200-1;
  return 1.25-.25*(t*t*(2.70158*t+1.70158)+1);
}
export function sway(rotation:ReturnType<typeof zeroRotation>, movement:number|null, dt:number){
  const angle=rotation.newRotation;
  let target=rotation.targetRotation, speed=rotation.lastSpeed, overshoot=rotation.overshootApplied;
  if(movement!==null&&Math.abs(movement)>1){
    speed=Math.abs(movement);overshoot=false;
    target=Math.max(-10,Math.min(10,angle+movement*.3));
  }else{
    if(!overshoot&&Math.abs(angle)<.3){target=-Math.sign(angle)*speed*.3*.1;overshoot=true;}
    else target-=Math.sign(angle)*(Math.abs(angle)/10)*400*dt;
    if(Math.abs(target)<.3){target=0;overshoot=false;}
  }
  return{newRotation:angle+.15*(target-angle),targetRotation:target,lastSpeed:speed,overshootApplied:overshoot};
}
// Original Wn/ebe: integer-percent keyframe time, per-segment easeInQuad.
export function automaticAngle(dx:number,elapsed:number,duration=270){
 const p=Math.min(100,Math.max(0,Math.round(elapsed/duration*100)));
 const peak=dx===0?0:Math.sign(dx)*(5+(Math.abs(dx)-1)/6*15);
 const times=[0,60,80,100],values=[0,peak,-peak*.5,0];
 let i=0;while(i<2&&p>times[i+1])i++;
 const t=(p-times[i])/(times[i+1]-times[i]);return values[i]+(values[i+1]-values[i])*t*t;
}
