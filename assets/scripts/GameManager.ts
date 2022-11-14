import { _decorator, Component, Node, random, Vec2, instantiate, Vec3, Sprite, resources, Texture2D, SpriteFrame, TERRAIN_HEIGHT_FACTORY, find, RichText, Button, EventHandler } from 'cc';
import { Block } from './Block';
import { ObjAction } from './ObjAction';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    //private blocks: number[] = [1, 2, 3, 4];
    private blocks: Block[] = [];

    @property([Node])
    public prefab: Node = null;
    private prefabs: Node[] = [];

    @property 
    public mangerPos: Vec3 = new Vec3();

    @property
    public blockCount: number = 24;

    @property
    public picWidth: number = 90;

    @property
    public picHeight: number = 90;

    //每堆有多少个
    @property
    public pileBlock: number = 8;

    @property
    public pileInterval: number = 5;

    @property
    public centerBlock: number = 64;

    private troughs: Block[] = [];

    public static instance: GameManager;
    @property(Node)
    public trough: Node = null;

    private troughPos: Vec3;

    private data: number[] = [];

    @property(Node)
    public popUp: Node = null;
    private text: RichText;

    private inGame: boolean = false;

    onLoad() {
        GameManager.instance = this;
        let troughNode = find("Canvas/trough");
        this.troughPos = troughNode.worldPosition;

        this.loadImg("");
        this.text = this.popUp.children[0].getComponent(RichText);
        this.text.node.active = false;
    }

        //开始游戏
    public startGame() : void {
        this.popUp.active = false;
        this.inGame = true;
        this.init();
    }

    //初始化
    init() {
        this.blocks = [];
        this.troughs = [];
        //this.offestX = this.offestY = 0;
        this.nodes = [];
        for (let node of this.node.children) {
            node.destroy();
        }
        this.initData();
        this.createScene();
    }

    initData() : void {
        this.data = [];
        let arr = [];
        //每组数量平均
        /*
        for (let i = 0; i < this.prefabs.length; i++) {
            for (let j = 0; j < 3 * this.group; j++) {
                arr.push(i);
            }
        }
        */
        //数量随机
        let num = 2 * this.pileBlock + this.centerBlock;
        //没有达到3的倍数 自动补充
        if (num % 3 != 0) {
            num += 3 - num % 3;
        }
        num /= 3;
        for (let i = 0; i < num; i++) {
            let index = Math.floor(Math.random() * this.prefabs.length);
            for (let j = 0; j < 3; j++) {
                arr.push(index);
            }
        }
        //打乱
        while (arr.length) {
            let rIndex = Math.random() * arr.length;

            this.data.push(arr[Math.floor(rIndex)]);
            arr.splice(rIndex, 1);
        }
    }

    createScene() {
        this.createPile(new Vec3(625, -265, 0));
        this.createPile(new Vec3(625, -365, 0));
        this.currentLayer = 0;
        while(this.data.length > 0) {
            this.createLayer();
        }
    }


    createPile(pos: Vec3) {
        let blockPos = new Vec3();
        const pile = new Node("pile");
        pile.setParent(this.node);
        pile.position = pos;
        let preBlock = null;
        for (let i = 0; i < this.pileBlock; i++) {
            blockPos.x += this.pileInterval;
            let block = this.createBlock(blockPos, this.data.pop(), pile, i);
            if (preBlock) {
                preBlock.addMask(block);
            }
            preBlock = block;

            block.node.setParent(pile);
            this.blocks.push(block);
        }

    }

    private moveEnd: boolean = true;
    public putInTrough(block: Block) : void {
        if (!this.inGame || !this.moveEnd) return;
        if (!block.canSelect()) return;
        this.moveEnd = false;
        this.moveForTrough(block);
        block.inTrough = true;
        //this.troughs.push(block);
        let list = this.blocks.filter(b => b.hasMask(block));
        for (let b of list) {
            b.removeMask(block);
        }
    }

    moveForTrough(block: Block) : void {
        //检查是否存在相同的块
        let list = this.troughs.filter(b => b.bId == block.bId);
        let index = this.troughs.lastIndexOf(list[list.length - 1]);
        //console.log(index);
        let targetPos;
        let callBack = () => {
            this.moveEnd = true;
            this.check(block);
        }
        if (index != -1) {
            let arr = [];
            this.copyArr(this.troughs, arr);
            //右边全体向右移动一格
            for (let i = index + 1; i < this.troughs.length; i++) {
                //this.troughs[i + 1] = arr[i];
                let block1 = this.troughs[i];
                arr[i + 1] = block1;
                let pos = new Vec3(block1.getPos().x + this.picWidth, block1.getPos().y, 0);

                block1.moveTo(pos, 2000);
            }
            arr[index + 1] = block;
            this.troughs = arr;
            //console.log(this.troughs[index + 1]);
            
            targetPos = new Vec3(this.troughs[index].getPos().x + this.picHeight, 71, 0);
            //console.log(targetPos2);
        }else { //没有则放到最后
            targetPos = new Vec3(this.troughPos.x + this.picWidth * this.troughs.length, 71, 0);
            this.troughs.push(block);
        }
        block.moveTo(targetPos, 1000, callBack);
        //console.log(this.troughs);
    }

    check(lastBlock: Block) : void {
        //检查是否有一个类型达到3 有则消除
        let list = this.troughs.filter(b => b.bId == lastBlock.bId);
        if (list.length >= 3) {
            for (let b of list) {
                this.blocks.splice(this.blocks.indexOf(b), 1);
                b.clear();
            }
            let index = this.troughs.findIndex(b => b.bId == lastBlock.bId);
            //console.log(index);
            //右边全体向左移动一格
            let arr = [];
            this.copyArr(this.troughs, arr);
            for (let i = index + 3; i < this.troughs.length; i++) {
                let block1 = this.troughs[i];
                arr[i - 3] = block1;
                let pos = new Vec3(block1.getPos().x - this.picWidth * 3, block1.getPos().y, 0);
                //交换位置
                block1.moveTo(pos, 2000);
            }
            arr.pop();
            arr.pop();
            arr.pop();

            this.troughs = arr;
            this.troughs = this.troughs.filter(b => b && b.isActive);
            //console.log(this.troughs);
        }
        //消除完毕后 检查是否还有剩余的块 没有将通关
        if (this.blocks.length == 0) {
            this.gameWin();
        }
        //达到7 游戏失败
        if (this.troughs.length >= 7) {
            this.gameOver();
        }
    }

    showWindow(text: string) {
        this.text.string = text;
        this.text.node.active = true;
        this.popUp.active = true;
    }

    gameWin() {
        this.inGame = false;
        this.showWindow("游戏胜利");
        //console.log("你赢了");
    }

    gameOver() {
        this.inGame = false;
        this.showWindow("游戏失败");
        //console.log("你输了");
    }

    copyArr(arr1: Block[], arr2: Block[]) {
        for (let value of arr1) {
            arr2.push(value);
        }
    }

    private nodes: Node[] = [];
    private currentLayer: number = 0;
    private createLayer() : void {
        //let list = [];
        let node = new Node("Layer");
        node.setParent(this.node);
        let pos = new Vec3();
        if (this.nodes.length > 0) {
            let offest = this.getOffest();

            let x = this.nodes[this.currentLayer - 1].position.x;
            let y = this.nodes[this.currentLayer - 1].position.y;
            node.position = new Vec3(x + offest.x, y + offest.y, 0);
        }
        let index = 0;
        for(let i = 0; i < 24; i++) {
            if (this.data.length == 0) return;
            if (Math.random() * 100 < 40) {
                let id = this.data.pop();
                let block = this.createBlock(pos, id, node, this.currentLayer);
                //添加被覆盖的块
                let list = this.blocks.filter(b => b.layer < block.layer && this.covered(b, block));
                for (let b of list) {
                    b.addMask(block);
                }
                this.blocks.push(block);
            }
            pos.x += this.picWidth;
            index++;
            if (index >= 6) {
                index = 0;
                pos.x = 0;
                pos.y -= this.picHeight;
            }
        }
        this.nodes.push(node);
        this.currentLayer++;
    }

    private covered(block1: Block, block2: Block) : boolean {
        if (block1 == block2) return false; 
        const x = block2.getPos().x - block1.getPos().x;
        const y = block2.getPos().y - block1.getPos().y;
        return Math.abs(x) < this.picWidth && Math.abs(y) < this.picHeight;
    }


    getOffest() : Vec2 {
        this.offestX = this.offestX == 0 ? 50 : -this.offestX;
        this.offestY = this.offestY == 0 ? 50 : -this.offestY;
        return new Vec2(this.offestX, this.offestY);
    }

    private offestX: number = 0;
    private offestY: number = 0;
    private getRandomOffest() : Vec2{
        /*
        let list = [50, -50];
        let index = Math.random() * list.length;
        //this.offestX = list[Math.floor(index)] == this.offestX ? -this.offestX : list[Math.floor(index)];
        //this.offestY = list[Math.floor(index)] == this.offestY ? -this.offestY : list[Math.floor(index)];
        let x = list[Math.floor(index)];
        index = Math.random() * list.length;
        let y = list[Math.floor(index)];
        */
       return new Vec2(this.offestX, this.offestY);
        //return new Vec2(x, y);
    }

    private createBlock(pos: Vec3, id: number, parent: Node, layer: number) : Block {
        let block = instantiate(this.prefabs[id]).addComponent(Block);
        block.bId = id;
        block.node.setParent(parent);
        block.SetPos(pos);

        block.layer = layer;
        return block;
    }

    private loadImg(path: string) {
        resources.loadDir(path, SpriteFrame, (err, spriteFrames) => {
            for (let sf of spriteFrames) {
                let node = instantiate(this.prefab);
                let sp = node.getChildByName("Pic").getComponent(Sprite);
                sp.spriteFrame = sf;

                this.prefabs.push(node);
            }
            //his.prefab.getComponent(Sprite).spriteFrame = spriteFrames[1];
        });

    }
}

