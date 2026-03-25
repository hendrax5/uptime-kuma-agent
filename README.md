<div align="center" width="100%">
    <img src="./public/icon.svg" width="128" alt="Uptime Kuma Logo" />
</div>

# Uptime Kuma (Master-Agent Fork)

> **Note**: This is a custom fork with **Master-Agent Distributed Monitoring** capabilities. It includes an `agent-node/` application that can run on remote servers to execute ping and HTTP checks, reporting back to this Master UI.

Uptime Kuma is an easy-to-use self-hosted monitoring tool.

<a target="_blank" href="https://github.com/hendrax5/uptime-kuma-agent"><img src="https://img.shields.io/github/stars/hendrax5/uptime-kuma-agent?style=flat" /></a> <a target="_blank" href="https://hub.docker.com/r/hendrax5/uptime-kuma-agent"><img src="https://img.shields.io/docker/pulls/hendrax5/uptime-kuma-agent" /></a> <a target="_blank" href="https://hub.docker.com/r/hendrax5/uptime-kuma-agent"><img src="https://img.shields.io/docker/v/hendrax5/uptime-kuma-agent/2?label=docker%20image%20ver." /></a> <a target="_blank" href="https://github.com/hendrax5/uptime-kuma-agent"><img src="https://img.shields.io/github/last-commit/hendrax5/uptime-kuma-agent" /></a> <a target="_blank" href="https://opencollective.com/uptime-kuma"><img src="https://opencollective.com/uptime-kuma/total/badge.svg?label=Open%20Collective%20Backers&color=brightgreen" /></a>
[![GitHub Sponsors](https://img.shields.io/github/sponsors/louislam?label=GitHub%20Sponsors)](https://github.com/sponsors/louislam) <a href="https://weblate.kuma.pet/projects/uptime-kuma/uptime-kuma/">
<img src="https://weblate.kuma.pet/widgets/uptime-kuma/-/svg-badge.svg" alt="Translation status" />
</a>

<img src="https://user-images.githubusercontent.com/1336778/212262296-e6205815-ad62-488c-83ec-a5b0d0689f7c.jpg" width="700" alt="Uptime Kuma Dashboard Screenshot" />

## 🥔 Live Demo

Try it!

Demo Server (Location: Frankfurt - Germany): <https://demo.kuma.pet/start-demo>

It is a temporary live demo, all data will be deleted after 10 minutes. Sponsored by [Uptime Kuma Sponsors](https://github.com/hendrax5/uptime-kuma-agent#%EF%B8%8F-sponsors).

## ⭐ Features

- Monitoring uptime for HTTP(s) / TCP / HTTP(s) Keyword / HTTP(s) Json Query / Websocket / Ping / DNS Record / Push / Steam Game Server / Docker Containers
- Fancy, Reactive, Fast UI/UX
- Notifications via Telegram, Discord, Gotify, Slack, Pushover, Email (SMTP), and [90+ notification services, click here for the full list](https://github.com/hendrax5/uptime-kuma-agent/tree/master/src/components/notifications)
- 20-second intervals
- [Multi Languages](https://github.com/hendrax5/uptime-kuma-agent/tree/master/src/lang)
- Multiple status pages
- Map status pages to specific domains
- Ping chart
- Certificate info
- Proxy support
- 2FA support

## 🔧 How to Install

### 🐳 Docker Compose (Build from Source)

> [!IMPORTANT]
> This fork uses `build:` in `compose.yaml` to build the image **from source code**, not from Docker Hub. Make sure to clone the full repository first before running Docker Compose.

```bash
git clone https://github.com/hendrax5/uptime-kuma-agent.git
cd uptime-kuma-agent
docker compose up --build -d
```

To rebuild after pulling new changes:

```bash
git pull
docker compose up --build -d
```

Uptime Kuma is now running on all network interfaces (e.g. http://localhost:3001 or http://your-ip:3001).

> [!WARNING]
> File Systems like **NFS** (Network File System) are **NOT** supported. Please map to a local directory or volume.

### 🐳 Docker Command (Pre-built Image)

If you prefer using a pre-built image from Docker Hub without building from source:

```bash
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma hendrax5/uptime-kuma-agent:2
```

Uptime Kuma is now running on all network interfaces (e.g. http://localhost:3001 or http://your-ip:3001).

If you want to limit exposure to localhost only:

```bash
docker run ... -p 127.0.0.1:3001:3001 ...
```

### 💪🏻 Non-Docker

Requirements:

- Platform
  - ✅ Major Linux distros such as Debian, Ubuntu, Fedora and ArchLinux etc.
  - ✅ Windows 10 (x64), Windows Server 2012 R2 (x64) or higher
  - ❌ FreeBSD / OpenBSD / NetBSD
  - ❌ Replit / Heroku
- [Node.js](https://nodejs.org/en/download/) >= 20.4
- [Git](https://git-scm.com/downloads)
- [pm2](https://pm2.keymetrics.io/) - For running Uptime Kuma in the background

```bash
git clone https://github.com/hendrax5/uptime-kuma-agent.git
cd uptime-kuma
npm run setup

# Option 1. Try it
node server/server.js

# (Recommended) Option 2. Run in the background using PM2
# Install PM2 if you don't have it:
npm install pm2 -g && pm2 install pm2-logrotate

# Start Server
pm2 start server/server.js --name uptime-kuma
```

Uptime Kuma is now running on all network interfaces (e.g. http://localhost:3001 or http://your-ip:3001).

More useful PM2 Commands

```bash
# If you want to see the current console output
pm2 monit

# If you want to add it to startup
pm2 startup && pm2 save
```

### Advanced Installation

If you need more options or need to browse via a reverse proxy, please read:

<https://github.com/hendrax5/uptime-kuma-agent/wiki/%F0%9F%94%A7-How-to-Install>

---

## 🤖 Agent Node Installation

The Agent Node runs on remote servers to execute monitoring checks (HTTP, Ping, Keyword) and reports results back to the Master. This enables **distributed monitoring** from multiple locations.

### Prerequisites

1. **Master must be running first** — Set up and access the Master UI (e.g. `http://your-master-ip:3001`)
2. **Get an Agent Token** — Go to **Settings → Agents** in the Master UI and generate a token

### Option 1: Docker Compose (Same Host as Master)

Edit `compose.yaml` and add the agent service:

```yaml
services:
  uptime-kuma:
    build:
      context: .
      dockerfile: docker/dockerfile
      target: release
    container_name: uptime-kuma-master
    restart: unless-stopped
    volumes:
      - ./data:/app/data
    ports:
      - "3001:3001"

  uptime-kuma-agent:
    build:
      context: ./agent-node
      dockerfile: Dockerfile
    container_name: uptime-kuma-agent
    environment:
      - MASTER_URL=http://uptime-kuma:3001
      - AGENT_TOKEN=<YOUR_AGENT_TOKEN_HERE>
    depends_on:
      - uptime-kuma
    restart: unless-stopped
```

Then run:

```bash
docker compose up --build -d
```

> [!NOTE]
> When running on the same Docker network, use the service name `http://uptime-kuma:3001` as the `MASTER_URL` (not `localhost`).

### Option 2: Standalone Docker (Remote Server)

Run the agent on a **different server** to monitor from that location:

```bash
# Clone the repo (only agent-node/ is needed)
git clone https://github.com/hendrax5/uptime-kuma-agent.git
cd uptime-kuma-agent

# Build and run the agent
docker build -t uptime-kuma-agent ./agent-node
docker run -d \
  --name uptime-kuma-agent \
  --restart unless-stopped \
  -e MASTER_URL=http://<MASTER_IP>:3001 \
  -e AGENT_TOKEN=<YOUR_AGENT_TOKEN_HERE> \
  uptime-kuma-agent
```

### Option 3: Non-Docker (Node.js)

Requirements: [Node.js](https://nodejs.org/) >= 20

```bash
cd agent-node
npm install

# Using environment variables
MASTER_URL=http://<MASTER_IP>:3001 AGENT_TOKEN=<YOUR_TOKEN> node index.js

# Or using CLI arguments
node index.js --master http://<MASTER_IP>:3001 --token <YOUR_TOKEN>
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MASTER_URL` | ✅ | Full URL of the Master node (e.g. `http://192.168.1.100:3001`) |
| `AGENT_TOKEN` | ✅ | Token generated from Master UI → Settings → Agents |

### Supported Monitor Types

| Type | Description |
|------|-------------|
| `http` | HTTP/HTTPS status code checks |
| `keyword` | HTTP response body keyword matching |
| `json-query` | JSON response query checks |
| `ping` | ICMP ping checks |

## 🆙 How to Update / Rebuild

After pulling new changes from the repository, rebuild the services:

```bash
git pull
```

### Rebuild Master Only

```bash
sudo docker compose down uptime-kuma
sudo docker compose up --build uptime-kuma -d
```

### Rebuild Agent Only

```bash
sudo docker compose down uptime-kuma-agent
sudo docker compose up --build uptime-kuma-agent -d
```

### Rebuild Both Master and Agent

```bash
sudo docker compose down
sudo docker compose up --build -d
```

> [!NOTE]
> If you have two compose files (`compose.yaml` and `docker-compose.yml`), use `-f` to specify which one:
> ```bash
> sudo docker compose -f docker-compose.yml up --build -d
> ```

### Monitor Logs

```bash
# Master logs
sudo docker logs -f uptime-kuma-master

# Agent logs
sudo docker logs -f uptime-kuma-agent
```

## 🆕 What's Next?

I will assign requests/issues to the next milestone.

<https://github.com/hendrax5/uptime-kuma-agent/milestones>

## ❤️ Sponsors

Thank you so much! (GitHub Sponsors will be updated manually. OpenCollective sponsors will be updated automatically, the list will be cached by GitHub though. It may need some time to be updated)

<img src="https://uptime.kuma.pet/sponsors?v=6" alt="Uptime Kuma Sponsors" />

## 🖼 More Screenshots

Light Mode:

<img src="https://uptime.kuma.pet/img/light.jpg" width="512" alt="Uptime Kuma Light Mode Screenshot of how the Dashboard looks" />

Status Page:

<img src="https://user-images.githubusercontent.com/1336778/134628766-a3fe0981-0926-4285-ab46-891a21c3e4cb.png" width="512" alt="Uptime Kuma Status Page Screenshot" />

Settings Page:

<img src="https://louislam.net/uptimekuma/2.jpg" width="400" alt="Uptime Kuma Settings Page Screenshot" />

Telegram Notification Sample:

<img src="https://louislam.net/uptimekuma/3.jpg" width="400" alt="Uptime Kuma Telegram Notification Sample Screenshot" />

## Motivation

- I was looking for a self-hosted monitoring tool like "Uptime Robot", but it is hard to find a suitable one. One of the closest ones is statping. Unfortunately, it is not stable and no longer maintained.
- Wanted to build a fancy UI.
- Learn Vue 3 and vite.js.
- Show the power of Bootstrap 5.
- Try to use WebSocket with SPA instead of a REST API.
- Deploy my first Docker image to Docker Hub.

If you love this project, please consider giving it a ⭐.

## 🗣️ Discussion / Ask for Help

⚠️ For any general or technical questions, please don't send me an email, as I am unable to provide support in that manner. I will not respond if you ask questions there.

I recommend using Google, GitHub Issues, or Uptime Kuma's subreddit for finding answers to your question. If you cannot find the information you need, feel free to ask:

- [GitHub Issues](https://github.com/hendrax5/uptime-kuma-agent/issues)
- [Subreddit (r/UptimeKuma)](https://www.reddit.com/r/UptimeKuma/)

My Reddit account: [u/louislamlam](https://reddit.com/u/louislamlam)
You can mention me if you ask a question on the subreddit.

## Contributions

### Create Pull Requests

Pull requests are awesome.
To keep reviews fast and effective, please make sure you’ve [read our pull request guidelines](https://github.com/hendrax5/uptime-kuma-agent/blob/master/CONTRIBUTING.md#can-i-create-a-pull-request-for-uptime-kuma).

### Test Pull Requests

There are a lot of pull requests right now, but I don't have time to test them all.

If you want to help, you can check this:
<https://github.com/hendrax5/uptime-kuma-agent/wiki/Test-Pull-Requests>

### Test Beta Version

Check out the latest beta release here: <https://github.com/hendrax5/uptime-kuma-agent/releases>

### Bug Reports / Feature Requests

If you want to report a bug or request a new feature, feel free to open a [new issue](https://github.com/hendrax5/uptime-kuma-agent/issues).

### Translations

If you want to translate Uptime Kuma into your language, please visit [Weblate Readme](https://github.com/hendrax5/uptime-kuma-agent/blob/master/src/lang/README.md).

### Spelling & Grammar

Feel free to correct the grammar in the documentation or code.
My mother language is not English and my grammar is not that great.
