function timeStamp()
{
    if (window.performance.now) return window.performance.now(); else return Date.now();
}

function isVisible(el: HTMLElement)
{
    const r = el.getBoundingClientRect();
    return r.top + r.height >= 0 && r.left + r.width >= 0 && r.bottom - r.height <= (window.innerHeight || document.documentElement.clientHeight) && r.right - r.width <= (window.innerWidth || document.documentElement.clientWidth);
}

export class Star
{
    x: number;
    y: number;
    z: number;
    size: number;

    constructor(x: number, y: number, z: number)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = 0.5 + Math.random();
    }
}

export class WarpSpeed
{
    targetId: string;
    SPEED: number;
    TARGET_SPEED: number;
    SPEED_ADJ_FACTOR: number;
    DENSITY: number;
    USE_CIRCLES: boolean;
    DEPTH_ALPHA: boolean;
    WARP_EFFECT: boolean;
    WARP_EFFECT_LENGTH: number;
    STAR_SCALE: number;
    BACKGROUND_COLOR: string;
    STAR_COLOR: string;
    prevW: number;
    prevH: number;
    stars: Star[];
    lastMoveTS: number;
    drawRequest: number | null;
    LAST_RENDER_T: number;
    PAUSED = false;
    size = 0;
    maxLineWidth: number;
    static RUNNING_INSTANCES: { [id: string]: WarpSpeed; } = {};

    constructor(targetId: string, config: any)
    {
        this.targetId = targetId;

        if (WarpSpeed.RUNNING_INSTANCES == undefined) WarpSpeed.RUNNING_INSTANCES = {};
        if (WarpSpeed.RUNNING_INSTANCES[targetId]) { WarpSpeed.RUNNING_INSTANCES[targetId]?.destroy(); }
        config = config || {};
        if (typeof config == "string") try { config = JSON.parse(config); } catch (e) { config = {}; }
        this.SPEED = config.speed == undefined || config.speed < 0 ? 0.7 : config.speed;
        this.TARGET_SPEED = config.targetSpeed == undefined || config.targetSpeed < 0 ? this.SPEED : config.targetSpeed;
        this.SPEED_ADJ_FACTOR = config.speedAdjFactor == undefined ? 0.03 : config.speedAdjFactor < 0 ? 0 : config.speedAdjFactor > 1 ? 1 : config.speedAdjFactor;
        this.DENSITY = config.density == undefined || config.density <= 0 ? 0.7 : config.density;
        this.USE_CIRCLES = config.shape == undefined ? true : config.shape == "circle";
        this.DEPTH_ALPHA = config.depthFade == undefined ? true : config.depthFade;
        this.WARP_EFFECT = config.warpEffect == undefined ? true : config.warpEffect;
        this.WARP_EFFECT_LENGTH = config.warpEffectLength == undefined ? 5 : config.warpEffectLength < 0 ? 0 : config.warpEffectLength;
        this.STAR_SCALE = config.starSize == undefined || config.starSize <= 0 ? 3 : config.starSize;
        this.BACKGROUND_COLOR = config.backgroundColor == undefined ? "hsl(263,45%,7%)" : config.backgroundColor;

        const canvas = document.getElementById(this.targetId) as HTMLCanvasElement;
        if (!canvas) { throw new Error("Expected valid element"); }

        canvas.width = 1; canvas.height = 1;
        this.STAR_COLOR = config.starColor == undefined ? "#FFFFFF" : config.starColor;
        this.prevW = -1; this.prevH = -1; // width and height will be set at first draw call
        this.stars = [];
        for (let i = 0; i < this.DENSITY * 1000; i++)
        {
            this.stars.push(new Star((Math.random() - 0.5) * 1000, (Math.random() - 0.5) * 1000, 1000 * Math.random()));
        }

        this.lastMoveTS = timeStamp();
        this.drawRequest = null;
        this.LAST_RENDER_T = 0;
        WarpSpeed.RUNNING_INSTANCES[targetId] = this;
        this.draw();
        this.maxLineWidth = 0;
    }


    draw = () =>
    {
        const TIME = timeStamp();
        if (!(document.getElementById(this.targetId)))
        {
            this.destroy();
            return;
        }
        this.move();
        const canvas = document.getElementById(this.targetId) as HTMLCanvasElement;
        if (!this.PAUSED && isVisible(canvas) && canvas)
        {
            if (this.prevW != canvas.clientWidth || this.prevH != canvas.clientHeight)
            {
                canvas.width = (canvas.clientWidth < 10 ? 10 : canvas.clientWidth) * (window.devicePixelRatio || 1);
                canvas.height = (canvas.clientHeight < 10 ? 10 : canvas.clientHeight) * (window.devicePixelRatio || 1);
            }
            this.size = (canvas.height < canvas.width ? canvas.height : canvas.width) / (10 / (this.STAR_SCALE <= 0 ? 0 : this.STAR_SCALE));
            if (this.WARP_EFFECT) this.maxLineWidth = this.size / 30;
            const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = this.BACKGROUND_COLOR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = this.STAR_COLOR;
            for (const s of this.stars)
            {
                const xOnDisplay = s.x / s.z, yOnDisplay = s.y / s.z;
                if (!this.WARP_EFFECT && (xOnDisplay < -0.5 || xOnDisplay > 0.5 || yOnDisplay < -0.5 || yOnDisplay > 0.5)) continue;
                const size = s.size * this.size / s.z;
                if (size < 0.3) continue; //don't draw very small dots
                if (this.DEPTH_ALPHA)
                {
                    const alpha = (1000 - s.z) / 1000;
                    ctx.globalAlpha = alpha < 0 ? 0 : alpha > 1 ? 1 : alpha;
                }
                if (this.WARP_EFFECT)
                {
                    ctx.beginPath();
                    const x2OnDisplay = s.x / (s.z + this.WARP_EFFECT_LENGTH * this.SPEED), y2OnDisplay = s.y / (s.z + this.WARP_EFFECT_LENGTH * this.SPEED);
                    if (x2OnDisplay < -0.5 || x2OnDisplay > 0.5 || y2OnDisplay < -0.5 || y2OnDisplay > 0.5) continue;
                    ctx.moveTo(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2);
                    ctx.lineTo(canvas.width * (x2OnDisplay + 0.5) - size / 2, canvas.height * (y2OnDisplay + 0.5) - size / 2);
                    ctx.lineWidth = size > this.maxLineWidth ? this.maxLineWidth : size;
                    if (this.USE_CIRCLES) { ctx.lineCap = "round"; } else { ctx.lineCap = "butt"; }
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.stroke();
                } else if (this.USE_CIRCLES)
                {
                    ctx.beginPath();
                    ctx.arc(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2, size / 2, 0, 2 * Math.PI);
                    ctx.fill();
                } else
                {
                    ctx.fillRect(canvas.width * (xOnDisplay + 0.5) - size / 2, canvas.height * (yOnDisplay + 0.5) - size / 2, size, size);
                }
            }
            this.prevW = canvas.clientWidth;
            this.prevH = canvas.clientHeight;
        }
        if (this.drawRequest != -1) this.drawRequest = requestAnimationFrame(this.draw.bind(this));
        this.LAST_RENDER_T = timeStamp() - TIME;
    };

    move = () =>
    {
        const t = timeStamp(), speedMulF = Math.min((t - this.lastMoveTS) / (1000 / 60), 2.0);
        this.lastMoveTS = t;
        if (this.PAUSED) return;
        const speedAdjF = Math.pow(this.SPEED_ADJ_FACTOR < 0 ? 0 : this.SPEED_ADJ_FACTOR > 1 ? 1 : this.SPEED_ADJ_FACTOR, 1 / speedMulF);
        this.SPEED = this.TARGET_SPEED * speedAdjF + this.SPEED * (1 - speedAdjF);
        if (this.SPEED < 0) this.SPEED = 0;
        const speed = this.SPEED * speedMulF;
        for (const s of this.stars)
        {
            s.z -= speed;
            while (s.z < 1)
            {
                s.z += 1000;
                s.x = (Math.random() - 0.5) * s.z;
                s.y = (Math.random() - 0.5) * s.z;
            }
        }
    };

    public destroy = (targetId?: number) =>
    {
        if (targetId)
        {
            if (WarpSpeed.RUNNING_INSTANCES[targetId]) WarpSpeed.RUNNING_INSTANCES[targetId]?.destroy();
        } else
        {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            try { cancelAnimationFrame(this.drawRequest!); } catch (e) { this.drawRequest = -1; }
            delete WarpSpeed.RUNNING_INSTANCES[this.targetId];
        }
    };

    pause = () =>
    {
        this.PAUSED = true;
    };

    resume = () =>
    {
        this.PAUSED = false;
    };
}
