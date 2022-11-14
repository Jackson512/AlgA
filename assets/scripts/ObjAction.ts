import { _decorator, Component, Node, Vec3, Vec2 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ObjAction')
export class ObjAction extends Component {

    public targetPos: Vec3;
    public speed: number;
    public callBack: any;

    public set(targetPos: Vec3, speed: number, callBack: any) : void {
        this.targetPos = targetPos;
        this.speed = speed;
        this.callBack = callBack;
    }

    getPos() : Vec3 {
        return this.node.worldPosition;
    }

    getDirection(pos1: Vec3, pos2: Vec3) : Vec3 {
        let d = new Vec3();
        d.x = pos2.x - pos1.x;
        d.y = pos2.y - pos1.y;
        return d.normalize();
    }

    update(deltaTime: number) {
        let dx = Vec3.distance(this.getPos(), this.targetPos);
        if (dx >= 0.1) {
            let currentPos = this.node.worldPosition;
            const d = this.getDirection(currentPos, this.targetPos);
            let x = currentPos.x + deltaTime * this.speed * d.x;
            let y = currentPos.y + deltaTime * this.speed * d.y;
            let pos = new Vec3(x, y, 0);
            //防止过线
            if  (Vec3.distance(currentPos, this.targetPos) <= Vec3.distance(pos, this.targetPos)) {
                this.node.setWorldPosition(this.targetPos);
                this.moveEnd();
            }else {
                this.node.setWorldPosition(pos);
            }
        }else {
            this.moveEnd();
        }
        /*else {
            this.node.setWorldPosition(this.targetPos);
            this.destroy();
        }
        */
    }

    moveEnd() : void {
        if (this.callBack) {
            this.callBack();
        };
        this.destroy();
    }
}

