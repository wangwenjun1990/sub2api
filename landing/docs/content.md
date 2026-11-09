<!-- page:quickstart -->
# 从这里，连接你的 Codex。

这是一份 GPT / Codex 接入指南。准备一个 API Key，跟着步骤，让 Codex 在你的终端里开始工作。

<div class="intro-meta"><span>适用于 Windows / Linux</span><span>GPT / Codex</span><span>按步骤完成即可</span></div>

## 开始之前

你需要一台可以联网的电脑，以及鹊桥控制台中可用的 **API Key**。已有 Node.js 或 Codex？直接跳到下一步。

<div class="journey">
<a href="#node"><span class="step-no">01</span><div><strong>准备运行环境</strong><p>安装 Node.js，自带 npm 包管理器。</p></div><span class="step-arrow">↗</span></a>
<a href="#codex"><span class="step-no">02</span><div><strong>安装 Codex</strong><p>一条命令，把编程助手装进终端。</p></div><span class="step-arrow">↗</span></a>
<a href="#cc-switch"><span class="step-no">03</span><div><strong>连接鹊桥</strong><p>用 CC Switch 管理 API 地址与密钥。</p></div><span class="step-arrow">↗</span></a>
</div>

## 选择你的操作系统

页面上方的系统按钮会同步切换所有教程中的命令和路径。请在实际运行 Codex 的系统中执行步骤。

:::windows
> **你正在阅读 Windows 版。** 使用 PowerShell 执行命令。安装完 Node.js 后，先关闭终端，再重新打开。
:::

:::linux
> **你正在阅读 Linux 版。** 在 Bash / 终端中执行命令。下文以 Ubuntu / Debian 为例；其他发行版按对应包管理方式安装。
:::

## 两种接入方式

<div class="route-cards">
<a href="#cc-switch"><span class="card-icon">⇄</span><strong>用 CC Switch 配置 <small>推荐新手</small></strong><p>可视化填写地址和密钥，管理与切换供应商。</p><span class="card-link">查看图形界面教程 →</span></a>
<a href="#configuration"><span class="card-icon">⌘</span><strong>手动编辑配置</strong><p>适合熟悉终端的用户，以及没有桌面的 Linux 服务器。</p><span class="card-link">查看配置文件说明 →</span></a>
</div>

## 准备好 API Key

1. 打开 [鹊桥控制台](https://api.queqiaohub.com/dashboard)，登录账号。
2. 在「API 密钥」中创建密钥，选择支持 Codex / OpenAI 的分组。
3. 复制密钥，并确认账户余额和分组中的可用模型。

> **收好你的密钥。** API Key 相当于调用服务的凭证。截图时请遮住完整密钥，不要提交到公开仓库。

<!-- screenshot:api-key | 控制台创建 API Key -->

<!-- page:node -->
# 安装 Node.js 与 npm

先准备运行环境。npm 随 Node.js 一起安装，不需要再单独下载。

## 下载与安装

:::windows
1. 打开 [Node.js 官方下载页](https://nodejs.org/zh-cn/download)。
2. 选择 **LTS（长期支持版）** 和 Windows 安装包（`.msi`）。处理器为 ARM 时选择对应架构。
3. 双击安装，保留默认的 npm 与 PATH 选项，按提示完成。
4. 关闭现有的 PowerShell 窗口，重新打开一个终端。

<!-- screenshot:node-windows | Windows 安装 Node.js -->
:::

:::linux
推荐使用版本管理器安装 Node.js，便于升级，也能减少全局 npm 安装时的权限问题。先按 [nvm 官方说明](https://github.com/nvm-sh/nvm#installing-and-updating) 安装 nvm，然后重新打开终端，执行：

```bash
nvm install --lts
nvm use --lts
```

也可以从 [Node.js 官方下载页](https://nodejs.org/zh-cn/download) 选择 Linux 和对应架构，按官方步骤安装 LTS 版。

<!-- screenshot:node-linux | Linux 安装 Node.js -->
:::

## 验证安装

在新打开的终端中逐行执行：

```bash
node --version
npm --version
```

两条命令都能输出版本号，就可以继续安装 Codex。版本号随 LTS 发布变化，无需与截图完全一致。

:::windows
如果提示 `npm.ps1` 无法加载，可以在 PowerShell 中改用 `npm.cmd --version`，后续的 `npm` 命令同样可以写成 `npm.cmd`。
:::

:::linux
如果 `nvm` 找不到，重新打开终端，或按 nvm 安装说明加载 shell 配置；`nvm` 是 shell 函数，应用在同一个用户的终端中。
:::

## 下一步

环境准备完成，前往 [安装 Codex](#codex)。

<!-- page:codex -->
# 安装 Codex

Codex CLI 是在终端中使用的编程助手。这份指南采用 npm 安装方式。

## 全局安装

在终端执行以下命令，等待安装完成：

```bash
npm install -g @openai/codex
```

:::windows
如果 PowerShell 提示禁止运行 `npm.ps1`，改用以下命令，无需调整系统执行策略：

```powershell
npm.cmd install -g @openai/codex
```
:::

:::linux
若出现 `EACCES` 权限错误，先回到 [Node.js 与 npm](#node)，用当前用户的 nvm 环境安装 Node.js，然后重试。
:::

## 检查是否安装成功

```bash
codex --version
```

看到版本号说明安装成功。如果提示找不到命令，先重开终端，再检查 npm 全局安装目录是否已加入 PATH。

<!-- screenshot:codex-installed | Codex 安装成功后的终端 -->

## 配置后再开始

接下来选择 [CC Switch 配置](#cc-switch) 或 [手动配置](#configuration)。接入鹊桥使用控制台创建的 API Key，请先完成供应商配置。

## 第一次运行

配置完成后，在你自己的项目目录打开终端，执行：

```bash
codex
```

可以先输入：「请介绍这个项目的目录结构，先不要修改文件。」按提示确认工作目录与权限，收到回复后再开始实际任务。

## 更新 Codex

```bash
npm install -g @openai/codex@latest
```

更新后结束旧会话，再重新启动 Codex。如使用的版本运行后台守护进程，也需要通过工具提供的重启入口重新加载配置；先保存正在进行的工作。

参考：[OpenAI 官方 Codex CLI 文档](https://developers.openai.com/codex/cli/)。

<!-- page:cc-switch -->
# 用 CC Switch 连接

把服务地址、API Key 和模型放在一起管理。以后切换供应商，不必反复寻找配置文件。

## 下载 CC Switch

前往 [CC Switch 官方 Releases](https://github.com/farion1231/cc-switch/releases/latest)，下载适合系统与处理器架构的最新安装包。

:::windows
选择文件名包含 `Windows` 的 `.msi` 安装包，或 `Windows-Portable.zip` 便携版。常见电脑选 x64 对应版本，ARM 电脑选 arm64 版本。安装后打开 CC Switch。

<!-- screenshot:cc-download-windows | Windows 下载与安装 CC Switch -->
:::

:::linux
Ubuntu / Debian 桌面系统选择 `.deb`；支持相应依赖的 RPM 系统选择 `.rpm`，也可以使用 AppImage。按自己的处理器架构选择 x86_64 / arm64。

Ubuntu / Debian 示例：把文件名替换成实际下载的文件名。

```bash
sudo apt install ./CC-Switch-实际版本-Linux-x86_64.deb
```

**需要图形桌面。** CC Switch 官方桌面版要求 glibc 2.35+ 与 WebKitGTK 4.1。仅通过 SSH 使用的服务器，请跳到 [手动配置](#configuration)。

<!-- screenshot:cc-download-linux | Linux 桌面安装 CC Switch -->
:::

## 添加 Codex 供应商

1. 打开 CC Switch，在侧栏选择 **Codex**。
2. 点击「添加供应商」或右上角的 **+**，选择自定义供应商。
3. 填入下表信息，保存后点击「启用」。不同版本的界面名称可能略有不同。

| 配置项 | 填写内容 |
| --- | --- |
| 供应商名称 | `鹊桥`，也可以自定义 |
| API 地址 / Endpoint | `https://api.queqiaohub.com`，优先使用控制台一键导入的地址 |
| API Key | 在鹊桥控制台创建的完整密钥 |
| 模型 | 填写当前分组支持的模型 ID，以控制台为准 |
| 接口协议（如有） | `Responses` |

> **更方便的方式。** 若控制台的 API 密钥页面提供「导入 CC Switch」，可以直接导入，再在 CC Switch 中核对并启用。不要重复给已带 `/v1` 的地址追加 `/v1`。

<!-- screenshot:cc-provider | CC Switch 的 Codex 供应商配置 -->

## 启用并验证

保存后启用「鹊桥」，结束旧 Codex 会话，在项目目录重新执行 `codex`，发送一条简单的问题确认有回复。若 CC Switch 提示重启 Codex 守护进程，请先保存任务，再按提示操作。

:::windows
如果你在 **WSL** 中运行 Codex，Windows 的配置目录与 WSL 的目录是两份。请在 CC Switch 的「设置 → 应用配置」中选择 WSL 内的 `.codex` 目录，或直接在 WSL 中 [手动配置](#configuration)。
:::

:::linux
CC Switch 应与 Codex 使用同一个 Linux 用户的配置目录。不要用 `sudo` 启动 Codex，否则可能读取到 root 用户的另一份配置。
:::

## 下一步

想了解各字段的作用？查看 [配置详解](#configuration)。遇到问题可以先看 [常见问题](#faq)。

参考：[CC Switch 官方中文说明](https://github.com/farion1231/cc-switch/blob/main/README_ZH.md)。

<!-- page:configuration -->
# 配置详解

不使用 CC Switch 时，也可以手动配置。已有配置请先备份，再合并需要的字段。

## 找到配置文件

默认配置文件在当前用户主目录下的 `.codex/config.toml`。如果设置过 `CODEX_HOME`，以该目录为准。

:::windows
在 PowerShell 中创建目录并打开配置文件：

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex"
notepad "$env:USERPROFILE\.codex\config.toml"
```

通常对应 `C:\Users\你的用户名\.codex\config.toml`。
:::

:::linux
在终端中创建目录并编辑文件：

```bash
mkdir -p ~/.codex
nano ~/.codex/config.toml
```

通常对应 `/home/你的用户名/.codex/config.toml`。也可以使用你熟悉的编辑器。
:::

## 填写供应商配置

下面使用环境变量存放密钥。请将 `YOUR_MODEL_ID` 替换为鹊桥控制台中当前分组可用的模型 ID。

```toml
model_provider = "queqiao"
model = "YOUR_MODEL_ID"

[model_providers.queqiao]
name = "鹊桥"
base_url = "https://api.queqiaohub.com"
wire_api = "responses"
env_key = "QUEQIAO_API_KEY"
requires_openai_auth = false
```

| 字段 | 作用 |
| --- | --- |
| `model_provider` | 当前使用的供应商 ID，与下方 `queqiao` 一致 |
| `model` | 实际请求的模型 ID，以控制台可用列表为准 |
| `base_url` | API 基础地址；按控制台接入说明填写，避免重复 `/v1` |
| `wire_api` | Codex 使用的接口协议，设置为 `responses` |
| `env_key` | 读取哪个环境变量作为 API Key |
| `requires_openai_auth` | 自定义供应商使用 API Key，设为 `false` |

## 设置 API Key

将示例中的 `YOUR_API_KEY` 替换为你的真实密钥。以下命令只对当前终端会话生效，随后在同一终端启动 Codex。

:::windows
```powershell
$env:QUEQIAO_API_KEY = "YOUR_API_KEY"
codex
```

需要长期使用时，可以在 Windows「编辑账户的环境变量」中添加 `QUEQIAO_API_KEY`，然后重新打开终端。
:::

:::linux
```bash
export QUEQIAO_API_KEY="YOUR_API_KEY"
codex
```

需要长期使用时，可以把环境变量设置加入自己的 `~/.bashrc`；使用 Zsh 则编辑 `~/.zshrc`。保存后重新打开终端。配置文件中含真实密钥时，请妥善保管。
:::

## 确认配置生效

1. 保存 `config.toml`，确认 `model` 已替换。
2. 在设有密钥环境变量的同一终端里启动 `codex`。
3. 发送简单的问题，确认能收到回复；也可在控制台查看调用记录。

<!-- screenshot:codex-ready | Codex 成功连接后的界面 -->

> **用 CC Switch 管理时**，优先在 CC Switch 内修改该供应商，再启用并重启 Codex，避免切换时手动修改的关键字段被覆盖。

参考：[OpenAI 官方配置参考](https://developers.openai.com/codex/config-reference/)。

<!-- page:faq -->
# 常见问题

先检查运行环境、密钥、地址和模型，通常就能找到问题。

## 提示找不到 node、npm 或 codex

先关闭终端再重新打开。运行 `node --version` 和 `npm --version`；如果这两条也失败，回到 [Node.js 安装](#node)。只有 `codex` 失败时，检查全局安装是否成功，以及 npm 全局目录是否在 PATH 中。

## Windows 提示无法加载 npm.ps1

把命令中的 `npm` 换成 `npm.cmd` 再运行。如果 `codex.ps1` 也受限制，可以执行 `codex.cmd`。这不需要修改系统执行策略。

## 请求返回 401 / 403

检查 API Key 是否完整、是否仍然有效，以及当前分组是否允许调用目标模型。手动配置时，确认环境变量与 `env_key` 指向同一个名称，并且在启动 Codex 的终端里可用。

## 请求返回 404 或模型不可用

核对地址是否重复出现 `/v1/v1`，接口协议是否为 `responses`，模型 ID 是否来自当前分组的可用模型列表。以控制台导出的接入配置为准。

## CC Switch 改完配置没有生效

确认已点击「启用」，保存正在进行的工作并重启 Codex；若 CC Switch 提示有后台守护进程，请使用其重启入口。也要检查 Codex 与 CC Switch 是否使用同一个用户、同一个配置目录，尤其是 Windows 与 WSL 混用时。

## Linux 服务器没有桌面环境

无需安装 CC Switch 桌面版。完成 [Node.js 安装](#node) 和 [Codex 安装](#codex) 后，按 [手动配置](#configuration) 设置地址、模型和 API Key 即可。

