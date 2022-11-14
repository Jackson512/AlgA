import { _decorator, Component, Node, Vec2, Vec3, EventTouch, TERRAIN_HEIGHT_BASE, sp } from 'cc';
import { GameManager } from './GameManager';
import { ObjAction } from './ObjAction';
const { ccclass, property } = _decorator;

@ccclass('Block')
export class Block extends Component {

    public bId: number;

    //public parentBlocks: Block[] = [];

    public layer: number;

    public blockName: string;

    private masks: Block[] = [];

    private mask: Node;

    public isActive: boolean = true;

    public inTrough: boolean = false;

    onLoad() {
        this.mask = this.node.getChildByName("mask");
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    }

    onTouchStart(event: EventTouch) {
        GameManager.instance.putInTrough(this);
    }

    canSelect() : boolean {
        return this.isActive && !this.inTrough;
    }

    moveTo(targetPos: Vec3, speed: number, callBack: any = null) {
        let action = this.node.addComponent(ObjAction);
        action.set(targetPos, speed, callBack);
    }

    public SetImg(name: string) : void {

    }

    public SetPos(pos: Vec3) {
        this.node.position = pos;
    }

    public getPos() : Vec3 {
        return this.node.worldPosition;
    }

    public clear() : void {
        this.node.destroy();
    }

    public addMask(block: Block) : void 
    {
        this.isActive = false;
        this.masks.push(block);
        this.mask.active = true;
    }

    public hasMask(block: Block) : boolean {
        return this.masks && this.masks.find(m => m == block) != null;
    }

    public removeMask(block: Block) : void {
        this.masks = this.masks.filter(b => b != block);
        if (this.masks.length == 0) {
            this.activeBlock();
        }
    }

    activeBlock() {
        this.isActive = true;
        this.mask.active = false;
    }
}

