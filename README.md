## 演示github-action部署github-page

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # 更改为你的默认分支

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v2

      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: 14  # 更改为你的 Node.js 版本

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist  # 更改为你的构建输出目录
```

* 指定了当代码推送到 main 分支时触发部署动作。

* 在 build-and-deploy 作业中，使用 actions/checkout 动作来检出代码库。接着，使用 actions/setup-node 动作来设置 Node.js 环境，并通过 npm install 安装项目的依赖。

* 使用 npm run build 来构建 Vue 项目，并生成静态文件输出到 ./dist 目录。

* 使用了 peaceiris/actions-gh-pages 动作来将构建生成的文件推送到 GitHub Pages 上。它会自动将 ./dist 目录中的内容发布到 GitHub Pages。

> 该配置文件还使用了内建变量 ${{ secrets.GITHUB_TOKEN }} 来获取 GitHub 的访问令牌，该令牌用于执行部署操作。你不需要手动设置这个令牌，GitHub Actions 会自动创建并使用它。

* 将上述配置文件保存为 .github/workflows/deploy.yml，并将其推送到你的仓库中。GitHub Actions 将在每次推送到 main 分支时自动运行部署流程，你可以在 Actions 选项卡中查看部署的过程和状态。

* 注意，在部署时，是部署在github根root下的二级文件下，所以这种部署方式需要修改打包根路径
  * 配置开发环境和生产环境
    * NODE_ENV: 当前环境
    * VITE_BASE_PATH： 打包根路径
    * VITE_BASE_ROUTE_URL： 路由根路径

    1. 新建.env.development
        ```
        ##开发环境
        NODE_ENV = 'development'
        VITE_BASE_PATH = './'
        VITE_BASE_ROUTE_URL = '/'
        ```

    2. 新建.env.production
        ```
        ##生产环境
        NODE_ENV = 'production'
        VITE_BASE_PATH = /github-page/
        VITE_BASE_ROUTE_URL = '/github-page/'
        ```

    3. 新建.env.testbuild
        ```
        ##生产环境
        NODE_ENV = 'testbuild'
        VITE_BASE_PATH = /66666666666666/
        VITE_BASE_ROUTE_URL = '/123123/'
        ```
    
  * 配置打包命令(package.json)内
  
    ```json
      "scripts": {
        "dev": "vite",
        "build": "vite build --mode production",
        "test": "vite build --mode testbuild",
        "preview": "vite preview",
        "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs --fix --ignore-path .gitignore",
        "format": "prettier --write src/"
      },
    ```

* 配置vite.config.js

  ```js
    import { fileURLToPath, URL } from 'node:url'

    import { defineConfig, loadEnv  } from 'vite'
    import vue from '@vitejs/plugin-vue'
    import vueJsx from '@vitejs/plugin-vue-jsx'
    import copy from 'rollup-plugin-copy'

    // https://vitejs.dev/config/
    export default defineConfig(({command, mode }) => {
    const env = loadEnv(mode, process.cwd());
    console.log('command, mode ===>:', command, mode, env.VITE_BASE_PATH)
    return {
        base: env.VITE_BASE_PATH,
        plugins: [
        vue(),
        vueJsx(),
        copy({
            targets: [ // 复制一份打包完成的index.html重命名为404.html到dist文件，解决github部署vue路由刷新404
                { 
                    src: 'dist/index.html', 
                    dest: 'dist' ,
                    rename: (name, extension, fullPath) => {
                        console.log('name, extension, fullPath: -->', name, extension, fullPath)
                        return `404.html`
                    }
                },
            ],
            hook: 'writeBundle'
        })
        ],
        resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
        }
    }
    })


  ```

* 配置路由根路径（必须是history模式）

  ```js
  const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_ROUTE_URL),
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView
      },
      {
        path: '/about',
        name: 'about',
        component: () => import('../views/AboutView.vue')
      }
    ]
  })
  ```

> 第一次在push到master上的时候，点击 GitHub 仓库的页面, 点击页面右上方的 “Settings”（设置）按钮，进入仓库的设置页面。点击左侧导航“Pages”进入页面，在选项 "Build and deployment"中，设置部署来源"Source"为 "Deploy from a branch", 设置部署的分支 "Branch"为"gh-pages"，等待大概3~30s后刷新当前页，即在`https://github.com/<你的用户名>/<你的仓库名称>/settings/pages`中看到你的部署网址

### github部署路由刷新404问题

> 原因： 

> 使用路由切换页面时，看起来的效果是页面在动态切换，实际上页面并没有真正刷新，路由是伪资源地址，因此，一旦布署上线，页面刷新了，没有后端支持的路由 URI 会被 github pages 当做真实的地址去请求资源，从而导致被引导到 404 页面。

#### 方法一

在打包项目的根目录配置一个与 index.html 完全一样的文件，但取名为 404.html，并且一定要与 index.html 在同一个目录级别。并在打包的时候引入

#### 方法二

在github部署的分支（我的是gh-pages分支）的index.html同级目录新增复制index.html文件为404.html

#### 方法三

如果仅仅是想布署为静态网站，而不寻求后端支持，可以关闭路由的 history 模式，使用默认的 hash 模式，它只能改参数而不允许改域名部分，参数修改了才会向后端请求资源。而 history 则会获取整个地址向后端请求资源，地址上任何改动都会向后端发送请求。
