// FreezePods V2 | all dimensions mm | hardware-free prototype
part="assembly"; // base, lid, pusher, assembly
$fn=96;
board_w=52; board_h=42; board_r=3; pcb=1.7;
fit=0.6; // clearance PER SIDE
button_x=20.5; button_y=1; // drawing: 5.5 from side, 20 from top
button_height=2.8; // assumed above front PCB face; measure actual board
button_gap=0.25;
travel=0.85;
D=90; wall=3; floor=3; board_z=24; base_h=board_z+pcb+0.6;
roof_under=board_z+pcb+button_height+button_gap+2.0;
roof=3; roof_top=roof_under+roof;
skirt=7; skirt_clear=0.35; lid_r=D/2+skirt_clear+2.4;
ring_od=58; ring_id=31; ring_t=4.5;
leg_d=5.8; guide_d=6.5; hook_d=7.2;
rest_z=roof_top+travel;
tip_z=board_z+pcb+button_height+button_gap;
leg_len=rest_z-tip_z;
module rounded(w,h,r,z){ linear_extrude(z) offset(r=r) square([w-2*r,h-2*r],center=true); }
module at_buttons(){for(s=[-1,1]) translate([s*button_x,button_y,0]) children();}
module base(){
 difference(){
 union(){
 difference(){cylinder(d=D,h=base_h);translate([0,0,floor])cylinder(d=D-2*wall,h=base_h);}
 // support towers, with top pockets accepting board corners; battery fits between towers
 for(s=[-1,1],t=[-1,1]) translate([s*25,t*17,0]) translate([-4,-4,0]) cube([8,8,base_h]);
 // radial wall ties for towers
 for(s=[-1,1],t=[-1,1]) hull(){translate([s*28,t*18,0])cylinder(d=4,h=board_z);translate([s*35,t*24,0])cylinder(d=4,h=board_z);}
 // snap bumps, two opposing sides
 for(a=[0,180]) rotate([0,0,a]) translate([D/2-0.5,0,base_h-4]) rotate([0,90,0]) cylinder(d=3.2,h=1.15);
 }
 // board pocket and rounded corner geometry
 translate([0,0,board_z]) rounded(board_w+2*fit,board_h+2*fit,board_r+fit,8);
 // USB cable notch at +Y, and optional edge cable at -Y
 translate([-8,35,board_z-6])cube([16,15,12]);
 translate([-12,-50,board_z-4])cube([24,15,10]);
 }
}
module lid_world(){
 difference(){union(){
 translate([0,0,roof_under])cylinder(r=lid_r,h=roof);
 translate([0,0,base_h-skirt])difference(){cylinder(r=lid_r,h=roof_under-base_h+skirt+0.05);translate([0,0,-0.01])cylinder(r=D/2+skirt_clear,h=roof_under-base_h+skirt+0.02);}
 // clamp board at four corners, no pressure on buttons or LEDs
 for(s=[-1,1],t=[-1,1])translate([s*24,t*17,board_z+pcb+0.15])cylinder(d=3,h=roof_under-board_z-pcb-0.1);
 }
 // LED window, aligned to matrix (offset toward edge connector)
 translate([0,-1.5,roof_under-0.1])rounded(22,23,2,roof+0.2);
 at_buttons()translate([0,0,roof_under-0.1])cylinder(d=guide_d,h=roof+0.2);
 // snap windows and relief slots make two flexible skirt fingers
 for(a=[0,180])rotate([0,0,a]){
 translate([D/2-1,-2.2,base_h-5.8])cube([7,4.4,3.6]);
 for(y=[-6,5])translate([D/2-2,y,base_h-skirt-0.1])cube([8,1,skirt+1]);}
 translate([-8,35,base_h-skirt-0.1])cube([16,20,roof_under-base_h+skirt-0.1]);
 translate([-12,-55,base_h-skirt-0.1])cube([24,20,roof_under-base_h+skirt-0.1]);
 }
}
module pusher(){ // local coordinates, top face on print bed; legs point up
 union(){
 difference(){cylinder(d=ring_od,h=ring_t);translate([0,0,-0.1])cylinder(d=ring_id,h=ring_t+0.2);}
 at_buttons()translate([0,0,ring_t-0.05])difference(){
 union(){cylinder(d=leg_d,h=leg_len+0.05); // solid contact extension
 translate([0,0,roof+travel])cylinder(d1=hook_d,d2=leg_d,h=1.5);}
 // split only the end of each leg, allowing snap insertion
 translate([-0.65,-4,roof+travel-1.5])cube([1.3,8,leg_len-(roof+travel-1.5)+0.2]);
 }
 }
}
module assembly(){color("#b6c6d4")base(); color("#d8e1e7",0.8)lid_world();color("#ed7843")translate([0,0,rest_z+ring_t])rotate([180,0,0])mirror([0,1,0])pusher(); color("#225c91")translate([0,0,board_z])rounded(board_w,board_h,board_r,pcb);}
if(part=="base")base();else if(part=="lid")translate([0,0,roof_top])rotate([180,0,0])lid_world();else if(part=="pusher")pusher();else assembly();