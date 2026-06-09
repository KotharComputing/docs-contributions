import type { EChartsOption } from "echarts"
import * as echarts from "echarts"
import katex from "katex"
import { DEFAULT_KOTHAR_ECHARTS_THEME, KOTHAR_ECHARTS_THEMES, type KotharEChartsTheme } from "./echarts-theme"

const DEFAULT_TITLE_FONT_SIZE = 18

type TitleSegment = { type: "text"; value: string } | { type: "math"; value: string; displayMode: boolean }

interface TitleRichStyle {
  width?: number
  height?: number
  lineHeight?: number
  align?: "left" | "center" | "right"
  verticalAlign?: "top" | "middle" | "bottom"
  color?: string
  backgroundColor?: { image: string }
}

interface TitleTextStyle {
  fontSize?: number
  color?: string
  fontFamily?: string
  fontWeight?: string | number
  fontStyle?: string
  rich?: Record<string, TitleRichStyle>
}

interface TitleOption {
  text?: string
  subtext?: string
  textStyle?: TitleTextStyle
  subtextStyle?: TitleTextStyle
  [key: string]: unknown
}

interface TplFormatterParam {
  $vars: string[]
  [key: string]: unknown
}

const MATH_PATTERN = /\$\$[\s\S]+?\$\$|\$[^$]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)/g

const getThemeTextStyle = (themeName: KotharEChartsTheme): TitleTextStyle => {
  const theme = KOTHAR_ECHARTS_THEMES[themeName] as Record<string, unknown>
  const globalTextStyle = (theme.textStyle as TitleTextStyle | undefined) ?? {}
  const title = theme.title as { textStyle?: TitleTextStyle } | undefined
  const titleTextStyle = title?.textStyle ?? {}

  return {
    color: titleTextStyle.color ?? globalTextStyle.color,
    fontWeight: titleTextStyle.fontWeight ?? globalTextStyle.fontWeight,
  }
}

const stripMathDelimiters = (value: string): { tex: string; displayMode: boolean } => {
  if (value.startsWith("$$")) {
    return { tex: value.slice(2, -2).trim(), displayMode: true }
  }
  if (value.startsWith("$")) {
    return { tex: value.slice(1, -1).trim(), displayMode: false }
  }
  if (value.startsWith("\\[")) {
    return { tex: value.slice(2, -2).trim(), displayMode: true }
  }
  return { tex: value.slice(2, -2).trim(), displayMode: false }
}

const parseTitleSegments = (text: string): TitleSegment[] => {
  const segments: TitleSegment[] = []
  let lastIndex = 0

  for (const match of text.matchAll(MATH_PATTERN)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) })
    }
    const { tex, displayMode } = stripMathDelimiters(match[0])
    segments.push({ type: "math", value: tex, displayMode })
    lastIndex = index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) })
  }

  return segments
}

const svgToDataUrl = (svgMarkup: string): string => {
  const encoded = encodeURIComponent(svgMarkup).replace(/%0A/g, "")
  return `data:image/svg+xml;utf8,${encoded}`
}

const escapeRichText = (text: string): string => text.replace(/[{}]/g, (char) => `\\${char}`)

const escapeHtml = (text: string): string => {
  const encodeHTML = (echarts.format as { encodeHTML?: (value: string) => string }).encodeHTML
  if (encodeHTML) return encodeHTML(text)
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

const isTitleOption = (value: unknown): value is TitleOption => typeof value === "object" && value !== null

const toArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : [value])

let cachedKatexCss: string | null = null

const getKatexCssText = (): string => {
  if (cachedKatexCss !== null) return cachedKatexCss
  if (typeof document === "undefined") return ""

  let css = ""
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList | undefined
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    if (!rules) continue
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.selectorText.includes(".katex")) {
        css += `${rule.cssText}\n`
      }
    }
  }

  if (css.length > 0) {
    cachedKatexCss = css
  }
  return css
}

const renderMathToSvg = (
  tex: string,
  fontSize: number,
  displayMode: boolean,
  textStyle?: TitleTextStyle,
): TitleRichStyle | null => {
  if (typeof document === "undefined" || !document.body) {
    return null
  }

  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode,
    output: "html",
  })

  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.visibility = "hidden"
  container.style.pointerEvents = "none"
  container.style.whiteSpace = "nowrap"
  container.style.fontSize = `${fontSize}px`
  if (textStyle?.color) container.style.color = textStyle.color
  if (textStyle?.fontFamily) container.style.fontFamily = textStyle.fontFamily
  if (textStyle?.fontWeight) container.style.fontWeight = String(textStyle.fontWeight)
  if (textStyle?.fontStyle) container.style.fontStyle = textStyle.fontStyle
  container.innerHTML = html
  document.body.appendChild(container)

  const rect = container.getBoundingClientRect()
  const width = rect.width || undefined
  const height = rect.height || undefined
  document.body.removeChild(container)

  const colorStyle = textStyle?.color ? `color:${textStyle.color};` : ""
  const fontFamilyStyle = textStyle?.fontFamily ? `font-family:${textStyle.fontFamily};` : ""
  const fontWeightStyle = textStyle?.fontWeight ? `font-weight:${textStyle.fontWeight};` : ""
  const fontStyleStyle = textStyle?.fontStyle ? `font-style:${textStyle.fontStyle};` : ""
  const katexCss = getKatexCssText()
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" width="${width ?? 0}" height="${
    height ?? 0
  }"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="${colorStyle}${fontFamilyStyle}${fontWeightStyle}${fontStyleStyle}font-size:${fontSize}px;display:inline-block;"><style>${katexCss}${katexCss ? "\n" : ""}.katex{color:inherit;font-weight:inherit}.katex *{color:inherit;font-weight:inherit}</style>${html}</div></foreignObject></svg>`

  return {
    width,
    height,
    lineHeight: Math.max(fontSize, height ?? fontSize),
    align: "center",
    verticalAlign: "middle",
    color: "rgba(0,0,0,0)",
    backgroundColor: {
      image: svgToDataUrl(svgMarkup),
    },
  }
}

const resolveTextStyle = (textStyle: TitleTextStyle | undefined, themeTextStyle: TitleTextStyle): TitleTextStyle => ({
  color: textStyle?.color ?? themeTextStyle.color,
  fontWeight: textStyle?.fontWeight ?? themeTextStyle.fontWeight,
  fontFamily: textStyle?.fontFamily,
  fontStyle: textStyle?.fontStyle,
  fontSize: textStyle?.fontSize,
  rich: textStyle?.rich,
})

const ensureTextStyle = (container: { textStyle?: TitleTextStyle }): TitleTextStyle => {
  container.textStyle ??= {}
  return container.textStyle
}

const hashMathKey = (value: string): string => {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) + hash + value.charCodeAt(index)
  }
  return Math.abs(hash).toString(36)
}

const renderMathToRichText = (
  text: string,
  textStyle?: TitleTextStyle,
  themeTextStyle: TitleTextStyle = getThemeTextStyle(DEFAULT_KOTHAR_ECHARTS_THEME),
  options?: { forceInline?: boolean },
): { text: string; rich: Record<string, TitleRichStyle> } | null => {
  const resolvedTextStyle = resolveTextStyle(textStyle, themeTextStyle)
  const fontSize = typeof resolvedTextStyle.fontSize === "number" ? resolvedTextStyle.fontSize : DEFAULT_TITLE_FONT_SIZE
  const segments = parseTitleSegments(text)
  if (!segments.some((segment) => segment.type === "math")) return null

  const richEntries: Record<string, TitleRichStyle> = {}
  let richText = ""

  for (const segment of segments) {
    if (segment.type === "text") {
      richText += escapeRichText(segment.value)
      continue
    }

    const displayMode = options?.forceInline ? false : segment.displayMode
    const styleKeySeed = `${displayMode ? "display" : "inline"}:${segment.value}:${fontSize}:${
      resolvedTextStyle.color ?? ""
    }:${resolvedTextStyle.fontFamily ?? ""}:${resolvedTextStyle.fontWeight ?? ""}:${resolvedTextStyle.fontStyle ?? ""}`
    const richKey = `katex_${hashMathKey(styleKeySeed)}`

    const mathStyle = renderMathToSvg(segment.value, fontSize, displayMode, resolvedTextStyle)
    if (!mathStyle) {
      richText += escapeRichText(segment.value)
      continue
    }

    richEntries[richKey] = mathStyle
    // Use a visible placeholder with transparent color so ECharts won't drop the segment.
    richText += `{${richKey}|\u25a0}`
  }

  return { text: richText, rich: richEntries }
}

const renderMathToHtml = (text: string, options?: { escapeText?: boolean }): string => {
  const segments = parseTitleSegments(text)
  if (!segments.some((segment) => segment.type === "math")) {
    return options?.escapeText ? escapeHtml(text) : text
  }

  let html = ""
  for (const segment of segments) {
    if (segment.type === "text") {
      html += options?.escapeText ? escapeHtml(segment.value) : segment.value
      continue
    }
    html += katex.renderToString(segment.value, {
      throwOnError: false,
      displayMode: segment.displayMode,
      output: "html",
    })
  }
  return html
}

const applyMathToTitle = (title: EChartsOption["title"], themeTextStyle: TitleTextStyle): EChartsOption["title"] => {
  if (!title) return title
  const titles = toArray(title as unknown)
  const updated = titles.map((titleOption) => {
    if (!isTitleOption(titleOption)) return titleOption
    const updatedOption: TitleOption = { ...titleOption }

    if (typeof updatedOption.text === "string") {
      const result = renderMathToRichText(updatedOption.text, updatedOption.textStyle, themeTextStyle)
      if (result) {
        const textStyle = ensureTextStyle(updatedOption)
        textStyle.rich = { ...textStyle.rich, ...result.rich }
        updatedOption.text = result.text
      }
    }

    if (typeof updatedOption.subtext === "string") {
      const result = renderMathToRichText(updatedOption.subtext, updatedOption.subtextStyle, themeTextStyle)
      if (result) {
        updatedOption.subtextStyle ??= {}
        updatedOption.subtextStyle.rich = { ...updatedOption.subtextStyle.rich, ...result.rich }
        updatedOption.subtext = result.text
      }
    }

    return updatedOption
  })

  return (Array.isArray(title) ? updated : updated[0]) as EChartsOption["title"]
}

const toTemplateParams = (value: unknown): TplFormatterParam => {
  if (value && typeof value === "object") {
    return { $vars: [], ...(value as Record<string, unknown>) }
  }
  return { value, name: value, $vars: [] }
}

const normalizeTplParams = (params: unknown): TplFormatterParam | TplFormatterParam[] => {
  if (Array.isArray(params)) {
    return params.map(toTemplateParams)
  }
  return toTemplateParams(params)
}

const formatTplSafe = (tpl: string, params: unknown): string =>
  echarts.format.formatTpl(tpl, normalizeTplParams(params))

const wrapRichFormatter = (
  formatter: unknown,
  textStyle: TitleTextStyle,
  themeTextStyle: TitleTextStyle,
  options?: { forceInline?: boolean },
): unknown => {
  if (typeof formatter === "function") {
    return (...args: unknown[]) => {
      const formatterFn = formatter as (...formatterArgs: unknown[]) => unknown
      const result = formatterFn(...args)
      if (typeof result !== "string") return result
      const richResult = renderMathToRichText(result, textStyle, themeTextStyle, options)
      if (!richResult) return result
      textStyle.rich = { ...textStyle.rich, ...richResult.rich }
      return richResult.text
    }
  }
  if (typeof formatter === "string") {
    return (value: unknown) => {
      const formatted = formatTplSafe(formatter, value)
      const richResult = renderMathToRichText(formatted, textStyle, themeTextStyle, options)
      if (!richResult) return formatted
      textStyle.rich = { ...textStyle.rich, ...richResult.rich }
      return richResult.text
    }
  }
  return formatter
}

const wrapHtmlFormatter = (formatter: unknown): unknown => {
  if (typeof formatter === "function") {
    return (...args: unknown[]) => {
      const formatterFn = formatter as (...formatterArgs: unknown[]) => unknown
      const result = formatterFn(...args)
      return typeof result === "string" ? renderMathToHtml(result) : result
    }
  }
  if (typeof formatter === "string") {
    return (params: unknown) => {
      const formatted = Array.isArray(params)
        ? params.map((item) => formatTplSafe(formatter, item)).join("<br/>")
        : formatTplSafe(formatter, params)
      return renderMathToHtml(formatted)
    }
  }
  return formatter
}

const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)

const formatTooltipValue = (value: unknown, valueFormatter?: (value: unknown) => string): string => {
  if (valueFormatter) {
    try {
      return valueFormatter(value)
    } catch {
      // Fall through to default formatting.
    }
  }
  if (value == null) return ""
  if (Array.isArray(value)) {
    return value.map((entry) => formatTooltipValue(entry, valueFormatter)).join(", ")
  }
  if (typeof value === "object") {
    if ("value" in (value as { value?: unknown })) {
      return formatTooltipValue((value as { value?: unknown }).value, valueFormatter)
    }
    try {
      return JSON.stringify(value)
    } catch {
      return Object.prototype.toString.call(value)
    }
  }
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return `${value}`
  if (typeof value === "symbol") {
    return value.description ? `Symbol(${value.description})` : "Symbol()"
  }
  if (typeof value === "function") {
    return value.name ? `[Function: ${value.name}]` : "[Function]"
  }
  return ""
}

const formatAxisLabelValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return `${value}`
  return ""
}

const formatTooltipLine = (
  params: Record<string, unknown>,
  options: { preferSeriesName: boolean; valueFormatter?: (value: unknown) => string },
): { line: string; seriesName: string; name: string } => {
  const marker = typeof params.marker === "string" ? params.marker : ""
  const seriesName =
    typeof params.seriesName === "string" || typeof params.seriesName === "number" ? String(params.seriesName) : ""
  const name = typeof params.name === "string" || typeof params.name === "number" ? String(params.name) : ""
  const value = formatTooltipValue((params as { value?: unknown }).value, options.valueFormatter)
  const label = options.preferSeriesName ? seriesName || name : name || seriesName
  const markerPrefix = marker && label ? `${marker} ` : marker
  const labelHtml = label ? renderMathToHtml(label, { escapeText: true }) : ""
  const valueHtml = value ? renderMathToHtml(value, { escapeText: true }) : ""
  const line =
    labelHtml && valueHtml
      ? `${markerPrefix}${labelHtml}: ${valueHtml}`
      : labelHtml
        ? `${markerPrefix}${labelHtml}`
        : valueHtml
          ? `${marker}${valueHtml}`
          : marker
  return { line, seriesName, name }
}

const formatDefaultTooltip = (params: unknown, valueFormatter?: (value: unknown) => string): string => {
  if (isUnknownArray(params)) {
    if (params.length === 0) return ""
    const first = params[0]
    const headerValue =
      first && typeof first === "object"
        ? ((first as { axisValueLabel?: unknown; axisValue?: unknown; name?: unknown }).axisValueLabel ??
          (first as { axisValueLabel?: unknown; axisValue?: unknown; name?: unknown }).axisValue ??
          (first as { axisValueLabel?: unknown; axisValue?: unknown; name?: unknown }).name)
        : undefined
    const header = renderMathToHtml(formatTooltipValue(headerValue), { escapeText: true })
    const lines = params
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => formatTooltipLine(item, { preferSeriesName: true, valueFormatter }).line)
      .filter((line) => line.length > 0)
    const headerBlock = header.length > 0 ? `${header}<br/>` : ""
    return `${headerBlock}${lines.join("<br/>")}`
  }
  if (params && typeof params === "object") {
    const { line, seriesName, name } = formatTooltipLine(params as Record<string, unknown>, {
      preferSeriesName: false,
      valueFormatter,
    })
    if (seriesName && name && seriesName !== name) {
      const seriesLabel = renderMathToHtml(seriesName, { escapeText: true })
      return `${seriesLabel}<br/>${line}`
    }
    return line
  }
  return renderMathToHtml(formatTooltipValue(params, valueFormatter), { escapeText: true })
}

const applyMathToLegend = (
  legend: EChartsOption["legend"],
  series: EChartsOption["series"],
  themeTextStyle: TitleTextStyle,
): EChartsOption["legend"] => {
  if (!legend) return legend
  const legends = toArray(legend as unknown)
  const updated = legends.map((legendOption) => {
    if (!isTitleOption(legendOption)) return legendOption
    const updatedLegend: TitleOption = { ...legendOption }
    const textStyle = ensureTextStyle(updatedLegend)
    const richNameMap = new Map<string, string>()
    const legendData = (updatedLegend as Record<string, unknown>).data
    const legendNames = Array.isArray(legendData)
      ? legendData
          .map((item) => {
            if (typeof item === "string") return item
            if (item && typeof item === "object" && "name" in item) {
              const name = (item as { name?: unknown }).name
              return typeof name === "string" || typeof name === "number" ? String(name) : ""
            }
            return ""
          })
          .filter((name) => name.length > 0)
      : []

    const seriesNames = Array.isArray(series)
      ? series
          .map((item) => {
            if (item && typeof item === "object" && "name" in item) {
              const name = (item as { name?: unknown }).name
              return typeof name === "string" || typeof name === "number" ? String(name) : ""
            }
            return ""
          })
          .filter((name) => name.length > 0)
      : []

    const names = Array.from(new Set([...legendNames, ...seriesNames]))

    for (const name of names) {
      const richResult = renderMathToRichText(name, textStyle, themeTextStyle, { forceInline: true })
      if (!richResult) continue
      textStyle.rich = { ...textStyle.rich, ...richResult.rich }
      richNameMap.set(name, richResult.text)
    }

    if (updatedLegend.formatter) {
      updatedLegend.formatter = wrapRichFormatter(updatedLegend.formatter, textStyle, themeTextStyle, {
        forceInline: true,
      })
    } else if (richNameMap.size > 0) {
      updatedLegend.formatter = (name: string) => richNameMap.get(name) ?? name
    }
    return updatedLegend
  })
  return (Array.isArray(legend) ? updated : updated[0]) as EChartsOption["legend"]
}

const applyMathToAxis = <
  T extends EChartsOption["xAxis"] | EChartsOption["yAxis"] | EChartsOption["radiusAxis"] | EChartsOption["angleAxis"],
>(
  axis: T,
  themeTextStyle: TitleTextStyle,
): T => {
  if (!axis) return axis
  const axes = toArray(axis as unknown)
  const updated = axes.map((axisOption) => {
    if (!axisOption || typeof axisOption !== "object") return axisOption
    const updatedAxis = { ...(axisOption as Record<string, unknown>) }
    const axisType = typeof updatedAxis.type === "string" ? updatedAxis.type : undefined
    if (typeof updatedAxis.name === "string") {
      const nameTextStyle = (updatedAxis.nameTextStyle as TitleTextStyle | undefined) ?? {}
      const richResult = renderMathToRichText(updatedAxis.name, nameTextStyle, themeTextStyle)
      if (richResult) {
        nameTextStyle.rich = { ...nameTextStyle.rich, ...richResult.rich }
        updatedAxis.nameTextStyle = nameTextStyle
        updatedAxis.name = richResult.text
      }
    }
    const axisLabel = updatedAxis.axisLabel
    if (axisLabel && typeof axisLabel === "object") {
      const axisLabelOption = axisLabel as {
        formatter?: unknown
        textStyle?: TitleTextStyle
        rich?: Record<string, TitleRichStyle>
        [key: string]: unknown
      }
      const axisLabelTextStyle: TitleTextStyle = {
        color: typeof axisLabelOption.color === "string" ? axisLabelOption.color : axisLabelOption.textStyle?.color,
        fontWeight:
          typeof axisLabelOption.fontWeight === "string" || typeof axisLabelOption.fontWeight === "number"
            ? axisLabelOption.fontWeight
            : axisLabelOption.textStyle?.fontWeight,
        fontFamily:
          typeof axisLabelOption.fontFamily === "string"
            ? axisLabelOption.fontFamily
            : axisLabelOption.textStyle?.fontFamily,
        fontStyle:
          typeof axisLabelOption.fontStyle === "string"
            ? axisLabelOption.fontStyle
            : axisLabelOption.textStyle?.fontStyle,
        fontSize:
          typeof axisLabelOption.fontSize === "number" ? axisLabelOption.fontSize : axisLabelOption.textStyle?.fontSize,
      }
      if (axisLabelOption.textStyle && typeof axisLabelOption.textStyle === "object") {
        for (const [key, value] of Object.entries(axisLabelOption.textStyle)) {
          axisLabelOption[key] ??= value
        }
        delete axisLabelOption.textStyle
      }
      axisLabelOption.rich ??= {}
      if (axisLabelOption.formatter) {
        const formatter = axisLabelOption.formatter
        if (typeof formatter === "function") {
          axisLabelOption.formatter = (...args: unknown[]) => {
            const formatterFn = formatter as (...formatterArgs: unknown[]) => unknown
            const result = formatterFn(...args)
            if (typeof result !== "string") return result
            const richResult = renderMathToRichText(result, axisLabelTextStyle, themeTextStyle, {
              forceInline: true,
            })
            if (!richResult) return result
            axisLabelOption.rich = { ...axisLabelOption.rich, ...richResult.rich }
            return richResult.text
          }
        } else if (typeof formatter === "string") {
          axisLabelOption.formatter = (params: unknown) => {
            const formatted = formatTplSafe(formatter, params)
            const richResult = renderMathToRichText(formatted, axisLabelTextStyle, themeTextStyle, {
              forceInline: true,
            })
            if (!richResult) return formatted
            axisLabelOption.rich = { ...axisLabelOption.rich, ...richResult.rich }
            return richResult.text
          }
        }
      } else if (axisType !== "time") {
        axisLabelOption.formatter = (value: unknown) => {
          const label = formatAxisLabelValue(value)
          const richResult = renderMathToRichText(label, axisLabelTextStyle, themeTextStyle, {
            forceInline: true,
          })
          if (!richResult) return label
          axisLabelOption.rich = { ...axisLabelOption.rich, ...richResult.rich }
          return richResult.text
        }
      }
      updatedAxis.axisLabel = axisLabel
    }
    return updatedAxis
  })
  return (Array.isArray(axis) ? updated : updated[0]) as T
}

const applyMathToSeries = (
  series: EChartsOption["series"],
  themeTextStyle: TitleTextStyle,
): EChartsOption["series"] => {
  if (!series) return series
  if (!Array.isArray(series)) return series
  const seriesArray = series as unknown[]
  return seriesArray.map((seriesOption): unknown => {
    if (!seriesOption || typeof seriesOption !== "object") return seriesOption
    const updatedSeries = { ...(seriesOption as Record<string, unknown>) }
    const label = updatedSeries.label
    if (label && typeof label === "object") {
      const labelOption = label as { formatter?: unknown; textStyle?: TitleTextStyle }
      labelOption.textStyle ??= {}
      labelOption.formatter = wrapRichFormatter(labelOption.formatter, labelOption.textStyle, themeTextStyle)
    }
    updatedSeries.label = label
    return updatedSeries
  }) as EChartsOption["series"]
}

const applyMathToTooltip = (tooltip: EChartsOption["tooltip"]): EChartsOption["tooltip"] => {
  if (!tooltip) return tooltip
  const tooltips = toArray(tooltip as unknown)
  const updated = tooltips.map((tooltipOption) => {
    if (!tooltipOption || typeof tooltipOption !== "object") return tooltipOption
    const updatedTooltip = { ...(tooltipOption as Record<string, unknown>) }
    if (updatedTooltip.renderMode !== "richText") {
      if (updatedTooltip.formatter) {
        updatedTooltip.formatter = wrapHtmlFormatter(updatedTooltip.formatter)
      } else {
        const valueFormatter =
          typeof updatedTooltip.valueFormatter === "function"
            ? (updatedTooltip.valueFormatter as (value: unknown) => string)
            : undefined
        updatedTooltip.formatter = (params: unknown) => formatDefaultTooltip(params, valueFormatter)
      }
    }
    return updatedTooltip
  })
  return (Array.isArray(tooltip) ? updated : updated[0]) as EChartsOption["tooltip"]
}

const applyMathToDataZoom = (
  dataZoom: EChartsOption["dataZoom"],
  themeTextStyle: TitleTextStyle,
): EChartsOption["dataZoom"] => {
  if (!dataZoom) return dataZoom
  const zooms = toArray(dataZoom as unknown)
  const updated = zooms.map((zoomOption) => {
    if (!zoomOption || typeof zoomOption !== "object") return zoomOption
    const updatedZoom = { ...(zoomOption as Record<string, unknown>) }
    const textStyle = (updatedZoom.textStyle as TitleTextStyle | undefined) ?? {}
    updatedZoom.textStyle = textStyle
    if ("labelFormatter" in updatedZoom) {
      updatedZoom.labelFormatter = wrapRichFormatter(updatedZoom.labelFormatter, textStyle, themeTextStyle)
    }
    if ("handleLabel" in updatedZoom && updatedZoom.handleLabel && typeof updatedZoom.handleLabel === "object") {
      const handleLabel = updatedZoom.handleLabel as { formatter?: unknown; textStyle?: TitleTextStyle }
      handleLabel.textStyle ??= {}
      handleLabel.formatter = wrapRichFormatter(handleLabel.formatter, handleLabel.textStyle, themeTextStyle)
    }
    return updatedZoom
  })
  return (Array.isArray(dataZoom) ? updated : updated[0]) as EChartsOption["dataZoom"]
}

const applyMathToToolbox = (toolbox: EChartsOption["toolbox"]): EChartsOption["toolbox"] => {
  if (!toolbox) return toolbox
  if (!toolbox || typeof toolbox !== "object") return toolbox
  const updatedToolbox = { ...(toolbox as Record<string, unknown>) }
  const feature = updatedToolbox.feature
  if (feature && typeof feature === "object") {
    const updatedFeature = { ...(feature as Record<string, unknown>) }
    for (const key of Object.keys(updatedFeature)) {
      const featureItem = updatedFeature[key]
      if (!featureItem || typeof featureItem !== "object") continue
      const typedFeature = featureItem as { title?: string | string[] }
      if (typeof typedFeature.title === "string") {
        typedFeature.title = renderMathToHtml(typedFeature.title)
      } else if (Array.isArray(typedFeature.title)) {
        typedFeature.title = typedFeature.title.map((title) => renderMathToHtml(title))
      }
    }
    updatedToolbox.feature = updatedFeature
  }
  return updatedToolbox as EChartsOption["toolbox"]
}

export const applyMathToOptions = (
  options: EChartsOption,
  theme: KotharEChartsTheme = DEFAULT_KOTHAR_ECHARTS_THEME,
): EChartsOption => {
  const themeTextStyle = getThemeTextStyle(theme)
  const clone =
    typeof structuredClone === "function"
      ? structuredClone(options)
      : (JSON.parse(JSON.stringify(options)) as EChartsOption)
  if ("title" in clone) {
    clone.title = applyMathToTitle(clone.title, themeTextStyle)
  }
  if ("legend" in clone) {
    clone.legend = applyMathToLegend(clone.legend, clone.series, themeTextStyle)
  }
  if ("xAxis" in clone) {
    clone.xAxis = applyMathToAxis(clone.xAxis, themeTextStyle)
  }
  if ("yAxis" in clone) {
    clone.yAxis = applyMathToAxis(clone.yAxis, themeTextStyle)
  }
  if ("radiusAxis" in clone) {
    clone.radiusAxis = applyMathToAxis(clone.radiusAxis, themeTextStyle)
  }
  if ("angleAxis" in clone) {
    clone.angleAxis = applyMathToAxis(clone.angleAxis, themeTextStyle)
  }
  if ("tooltip" in clone) {
    clone.tooltip = applyMathToTooltip(clone.tooltip)
  }
  if ("series" in clone) {
    clone.series = applyMathToSeries(clone.series, themeTextStyle)
  }
  if ("dataZoom" in clone) {
    clone.dataZoom = applyMathToDataZoom(clone.dataZoom, themeTextStyle)
  }
  if ("toolbox" in clone) {
    clone.toolbox = applyMathToToolbox(clone.toolbox)
  }
  return clone
}
