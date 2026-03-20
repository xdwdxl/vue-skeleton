/**
 * @component GanttChart - Gantt chart export entry
 * @author Lorin Luo
 * @date 2026-01-07
 */
import GanttChart from './GanttChart.vue'
import DHtmlxGantt from './DHtmlxGantt.vue'

export type GanttTask = {
  id: string
  name?: string
  start: string | number | Date
  end: string | number | Date
  color?: string
}

export type GanttOptions = {
  barHeight?: string | number
  dateFormat?: string
  animations?: boolean
  dataLabels?: boolean
  colors?: string[]
}

export { GanttChart }
export default GanttChart
export { DHtmlxGantt }

