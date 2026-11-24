// FreezePods V6 — straight supports and press-fit lid | all dimensions mm | hardware-free prototype
part="assembly"; // base, lid, pusher, assembly
$fn=96;
board_w=52; board_h=42; board_r=3; pcb=1.7;
fit=0.6; // clearance PER SIDE
button_x=20.5; button_y=1; // drawing: 5.5 from side, 20 from top
button_height=2.8; // assumed above front PCB face; measure actual board
button_gap=0; // tips rest on buttons without preload
travel=0.65; // assumed safe switch travel; verify actual board
D=90; wall=3; floor=3; board_z=24; base_h=board_z+pcb+0.6;
roof_under=board_z+pcb+button_height+button_gap+2.0;
roof=3; roof_top=roof_under+roof;
skirt=7; skirt_clear=0.10; lid_r=D/2+skirt_clear+2.4; // radial clearance; adjust for printer
seat_inner=D/2-wall+0.25;
ring_od=80; // choose 58 or 80 mm to export either pusher ring_id=31; ring_t=4.5;
leg_d=5.5; guide_d=7.0; // 0.75 mm radial clearance
// LED face up, USB toward +Y: battery socket is at negative X, positive Y.
// Original four corner locations. Narrow only the connector-side support.
supports=[[-25,17],[-25,-17],[25,-17],[25,17]];
connector_post_inner_x=-24.8; // full-height inner edge; adjust after measuring socket
usb_notch=false; // enable if cable access is wanted
rest_z=roof_top+travel;
tip_z=board_z+pcb+button_height+button_gap;
leg_len=rest_z-tip_z;
module rounded(w,h,r,z){ linear_extrude(z) offset(r=r) square([w-2*r,h-2*r],center=true); }
module at_buttons(){for(s=[-1,1]) translate([s*button_x,button_y,0]) children();}
module base(){
 difference(){
 union(){
 difference(){cylinder(d=D,h=base_h);translate([0,0,floor])cylinder(d=D-2*wall,h=base_h);}
 // Three original 8 x 8 mm towers, one narrow rectangular tower.
 for(pt=supports)
   if(pt[0]==-25 && pt[1]==17)
     translate([-29,13,0])cube([connector_post_inner_x+29,8,base_h]);
   else translate([pt[0]-4,pt[1]-4,0])cube([8,8,base_h]);

 }
 // board pocket and rounded corner geometry
 translate([0,0,board_z]) rounded(board_w+2*fit,board_h+2*fit,board_r+fit,8);
 if(usb_notch)translate([-8,35,board_z-6])cube([16,15,12]);
 }
}
module lid_world(){
 difference(){union(){
 translate([0,0,roof_under])cylinder(r=lid_r,h=roof);
 // Plain friction-fit skirt; internal shoulder seats on the base rim.
 translate([0,0,base_h-skirt])difference(){
 cylinder(r=lid_r,h=roof_under-base_h+skirt+0.05);
 translate([0,0,-0.01])cylinder(r=D/2+skirt_clear,h=skirt+0.01);
 translate([0,0,skirt-0.01])cylinder(r=seat_inner,h=roof_under-base_h+0.08);
 }
 // Board retainers align with relocated supports; light clearance above PCB.
 for(pt=[[-25,5],[-25,-17],[25,-17],[25,17]])translate([pt[0]<0?-24:24,pt[1],board_z+pcb+0.2])cylinder(d=3,h=roof_under-board_z-pcb-0.15);
 }
 // Only necessary openings: LED display and two smooth pusher guides.
 translate([0,-1.5,roof_under-0.1])rounded(22,23,2,roof+0.2);
 at_buttons()translate([0,0,roof_under-0.1])cylinder(d=guide_d,h=roof+0.2);
 if(usb_notch)translate([-8,35,base_h-skirt-0.1])cube([16,20,roof_under-base_h+skirt-0.1]);
 }
}
module pusher(){ // print top face on bed; smooth legs point up
 union(){
 difference(){cylinder(d=ring_od,h=ring_t);translate([0,0,-0.1])cylinder(d=ring_id,h=ring_t+0.2);}
 at_buttons()translate([0,0,ring_t-0.05])cylinder(d=leg_d,h=leg_len+0.05);
 }
}
module assembly(){color("#b6c6d4")base(); color("#d8e1e7",0.8)lid_world();color("#ed7843")translate([0,0,rest_z+ring_t])rotate([180,0,0])mirror([0,1,0])pusher(); color("#225c91")translate([0,0,board_z])rounded(board_w,board_h,board_r,pcb); color("#f1dca8")translate([-24,14,board_z-5.5])cube([9,7,5.5]); color("#333333")at_buttons()translate([0,0,board_z+pcb])cylinder(d=4,h=button_height);}
if(part=="base")base();else if(part=="lid")translate([0,0,roof_top])rotate([180,0,0])lid_world();else if(part=="pusher")pusher();else assembly();