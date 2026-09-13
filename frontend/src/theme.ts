import { createTheme, type MantineColorsTuple } from '@mantine/core'

export const brand: MantineColorsTuple = [
  '#fff4e6',
  '#ffe8cc',
  '#ffd8a8',
  '#ffc078',
  '#ffa94d',
  '#ff922b',
  '#f86e12',
  '#e0620a',
  '#c75004',
  '#ad4200',
]

export const theme = createTheme({
  fontFamily: "'Inter Variable', Inter, ui-sans-serif, system-ui, sans-serif",
  primaryColor: 'brand',
  colors: { brand },
})
