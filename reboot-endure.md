# Reboot Endurance Setup — Timeceptor

> Ensures the site at **timeceptor.com** (port 47000) comes back automatically
> after any VM reboot (Oracle Cloud, Ubuntu 22.04 ARM64).

---

## ✅ Current Status (April 11, 2026)

| Service | Status |
|---------|--------|
| Nginx | `enabled` + `active` ✅ |
| PM2 `timeceptor` process | `online` ✅ |
| PM2 systemd service (`pm2-ubuntu`) | `enabled` ✅ |
| PM2 dump saved | ✅ |

**Everything is already configured.** After the next reboot the site will come back automatically with zero manual work.

---

## 🔁 How It Works After Reboot

1. `systemd` starts **nginx** → reverse proxy is live
2. `systemd` starts **pm2-ubuntu** service → PM2 resurrects from saved dump
3. PM2 restarts the `timeceptor` Node process on port **47000**
4. Site is live again — no SSH needed

---

## 🛠 Setup Commands (already run — kept here for reference)

### Step 1 — Nginx auto-start
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 2 — PM2 startup (register as systemd service)
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### Step 3 — Save current process list
```bash
pm2 save
```
This freezes the running process list to `~/.pm2/dump.pm2`.
PM2 will resurrect exactly this list on every reboot.

---

## 🔍 Verify Everything Is Good

```bash
# Check nginx
sudo systemctl is-enabled nginx        # should print: enabled
sudo systemctl is-active nginx         # should print: active

# Check PM2 systemd service
sudo systemctl is-enabled pm2-ubuntu   # should print: enabled

# Check running processes
pm2 status                             # timeceptor should be online

# Check saved dump exists
cat ~/.pm2/dump.pm2 | grep name        # should show timeceptor
```

---

## ⚡ After a Reboot — Quick Health Check

```bash
pm2 status
sudo systemctl status nginx --no-pager
curl -I http://localhost:47000
```

If `timeceptor` is not online after reboot:
```bash
pm2 resurrect        # manually restore from dump
pm2 save             # re-save if needed
```

---

## 📌 Important Notes

- **Do NOT run `pm2 delete timeceptor` without saving** — it will clear the dump and the process won't restart after reboot.
- After any PM2 change (new process, env update, etc.) always run `pm2 save` again.
- `VITE_FIREBASE_AUTH_DOMAIN` must stay as `timeceptor1.firebaseapp.com` — do not change.
- Never commit `data/windows/firebase-service-account.json` or `.env` to git.
