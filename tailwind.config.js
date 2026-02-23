/**
 * 文件说明（是什么）：
 * - 本文件是「Tailwind 配置模块」。
 * - 定义原子类扫描范围、主题扩展与插件能力。
 *
 * 设计原因（为什么）：
 * - 集中约束样式令牌与生成规则，避免样式体系无序增长。
 * - 通过在该文件集中同类职责，避免逻辑分散，降低后续维护与排障成本。
 */

import tailwindcss_primeui from 'tailwindcss-primeui'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [tailwindcss_primeui],
}
