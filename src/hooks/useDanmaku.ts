export const useDanmaku = (canvas:Ref<HTMLCanvasElement>,options:options) => {
  const dm = ref<Danmaku>()
  let ob =  new ResizeObserver((entries)=>{
      const a= entries[0].contentRect   
      canvas.value.width = a.width * window.devicePixelRatio
      canvas.value.height = a.height * window.devicePixelRatio 
    })
  onMounted(() => {
    ob.observe(canvas.value)
    options.canvas = canvas.value
    dm.value = new Danmaku(options)
    // setInterval(()=>dm.value?.add('弹幕测试'),200)
  })
  onBeforeUnmount(()=>ob.unobserve(canvas.value))
  return dm
}

export class Danmaku {
  canvas: HTMLCanvasElement;
  colors!: string[];
  ctx: CanvasRenderingContext2D;
  isdraw: boolean;
  lines!: { top: number; width: number; }[];
  textList: text[] 
  fontSize!:number
  font!:string
  rows!:number
  gap!: number; 
  speed: number 
  opacity!:number
  opacityStr!:string
  constructor(options: options) {

    this.isdraw = false
    this.textList = []
    this.canvas = options.canvas! 
    
    
    this.ctx = this.canvas.getContext('2d')!  
    this.speed = options.speed || 2 
    this.setFont(options.fontSize || 16)
    this.setGap(options.gap||8 )
    this.setRows(options.rows ||4 )
    this.setOpacity(options.opacity|| 100)
    this.setColors(options.colors || ['FFFFFF', '#00FF80', '#00FFFF', '#FF00FF', '#8000FF', '#FF9933'])
    this.resize()
  }
  resize(){ 
    this.canvas.width = this.canvas.getBoundingClientRect().width *  window.devicePixelRatio
    this.canvas.height=this.canvas.getBoundingClientRect().height *  window.devicePixelRatio
    this.initRows()
  } 
  setOpacity(val:number){
    this.opacity = val
    const a = Math.floor(2.55 * val).toString(16)
    this.opacityStr = a.length==1?'0'+a:a  
  }
  setRows(val:number){
    this.rows = val 
  }
  setSpeed(val:number){
    this.speed = val
  }
  setFont(size: number, family?: string) {
    this.ctx.textBaseline = 'top'
    this.fontSize = size
    this.font =  `${size}px sans-serif`  
  }
  setGap(gap:number){
    this.gap = gap 
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
    const w = this.canvas.width + width 
    this.lines[line].width = w
    this.textList.push({
      value,
      width,
      line,
      left: this.canvas.width, 
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
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
  private initRows() {
    this.lines = []
    let i = -1
    const height = this.gap + this.fontSize  
    while (++i < this.rows ) {
      this.lines.push({ top: this.gap + height * i, width: this.canvas.width })
    }  
  }
  private draw() {  
    this.ctx.textBaseline = 'top'
    this.ctx.font = this.font
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    let index = -1
    let len = this.textList.length
    const newList = [] as text[]
    while (++index < len) {
      const text = this.textList[index]
      const width = text.left + text.width
      if (width <= 0) continue
      // this.ctx.fillStyle = text.color
      this.ctx.fillStyle = text.color + this.opacityStr
      const line = this.lines[text.line]
      if(!line) continue
      this.ctx.fillText(text.value, text.left, this.lines[text.line].top )
      text.left -= this.speed
      newList.push(text) 
      line.width = Math.max(width, this.canvas.width)
    }
    this.textList = newList
    newList.length == 0 ? this.isdraw = false : requestAnimationFrame(this.draw.bind(this))
  }

}

type options = {
  canvas?: HTMLCanvasElement, 
  fontSize?: number,
  gap?: number,
  rows?: number,
  time?: number
  speed?: number
  opacity?:number
  colors?: string[]
}
type text = {
  value: string
  left: number
  color: string
  width: number
  line: number
}