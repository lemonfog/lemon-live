export const useDanmaku = (canvas: Ref<HTMLCanvasElement>) => {
  const dm = ref<Danmaku>()
  onMounted(() => {
    dm.value = new Danmaku({canvas:canvas.value})
    // setInterval(()=>dm.value?.add('弹幕测试'),1000)
  })
  return dm
}

export class Danmaku {
  canvas: HTMLCanvasElement;
  colors!: string[];
  ctx: CanvasRenderingContext2D;
  isdraw: boolean;
  lines!: { top: number; width: number; }[];
  textList: text[]
  fontSize!: number
  gap!: number;
  area!: number; 
  speed: number 
  constructor(options: options) {

    this.isdraw = false
    this.textList = []
    this.canvas = options.canvas 
    this.ctx = this.canvas.getContext('2d')! 
    this.speed = options.speed || 2 
    this.setFont(options.fontSize || 16)
    this.setGap(this.fontSize * 0.75  )
    this.setArea(options.area || 50)
    this.setColors(options.colors || ['FFFFFF', '#00FF80', '#00FFFF', '#FF00FF', '#8000FF', '#FF9933'])
     
  }
  resize(){
    // this.setFont(this.fontSize) 
    this.initLine(this.area)
  } 
  setSpeed(val:number){
    this.speed = val
  }
  setFont(size: number, family?: string) {
    this.ctx.textBaseline = 'top'
    this.fontSize = size
    this.ctx.font = `bold ${size}px ${family || 'STheiti, SimHei'}`
  }
  setGap(gap:number){
    this.gap = gap
  }
  setArea(area: number) {
    this.area = area
    this.initLine(area)
  }
  setColors(colors: string[]) {
    this.colors = colors
  }
  clean() {
    this.textList = []
    this.isdraw = false
  }
  destory() {
    this.clean()
  }
  add(value: string) {
    const line = this.getLine()
    if (line == -1) return
    const width = Math.ceil(this.ctx.measureText(value).width)
    const w = this.canvas.width + width + this.gap/2
    this.lines[line].width = w
    this.textList.push({
      value,
      width,
      line,
      left: this.canvas.width, 
      color: this.colors[Math.floor(Math.random() * 6)],
    })
    if (this.isdraw) return
    this.isdraw = true
    this.draw()
  }
  private getLine() {
    let index = -1
    let len = this.lines.length
    while (++index < len) {
      if (this.lines[index].width == this.canvas.width) return index
    }
    return -1
  }
  private initLine(area: number) {
    this.lines = []
    let i = -1
    const height = this.gap + this.fontSize
    const len = this.canvas.height * area / 100 / height | 0
    while (++i < len) {
      this.lines.push({ top: this.gap + height * i, width: this.canvas.width })
    } 
  }
  private draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let index = -1
    let len = this.textList.length
    const newList = [] as text[]
    while (++index < len) {
      const text = this.textList[index]
      const width = text.left + text.width
      if (width <= 0) continue
      this.ctx.fillStyle = text.color
      this.ctx.fillText(text.value, text.left, this.lines[text.line].top )
      text.left -= this.speed
      newList.push(text)
      const line = this.lines[text.line]
      line.width = Math.max(width, this.canvas.width)
    }
    this.textList = newList
    newList.length == 0 ? this.isdraw = false : requestAnimationFrame(this.draw.bind(this))
  }

}

type options = {
  canvas: HTMLCanvasElement,
  fontSize?: number,
  gap?: number,
  area?: number,
  time?: number
  speed?: number
  colors?: string[]
}
type text = {
  value: string
  left: number
  color: string
  width: number
  line: number
}