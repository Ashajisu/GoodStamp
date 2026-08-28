import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
    base: '/GoodStamp/',
    plugins: [
        vue(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: 'GoodStamp', 
                short_name: 'GoodStamp', 
                start_url: './', 
                display: 'standalone', 
                background_color: '#fffaf2', 
                theme_color: '#fffaf2', 
                icons: []}
        })]
})
