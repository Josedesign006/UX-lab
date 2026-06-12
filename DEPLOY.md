# Deploying UXLab on Oracle Cloud Always Free

End result: UXLab running at `https://<yourname>.duckdns.org`, with HTTPS,
permanent storage, and $0/month cost. Total setup time ≈ 45–60 minutes,
done once.

## 1. Create the Oracle Cloud account

1. Sign up at <https://www.oracle.com/cloud/free/>. A credit card is required
   for identity verification only — Always Free resources never charge it.
2. **Choose your home region carefully** — it cannot be changed later. Pick
   the one closest to your participants.
3. Recommended: after signup, upgrade the account to **Pay As You Go**
   (Billing → Upgrade). You still pay $0 as long as you only use Always Free
   shapes, but Oracle stops reclaiming "idle" free-tier VMs.

## 2. Create the VM

1. Console → **Compute → Instances → Create instance**.
2. Image: **Ubuntu 24.04** (aarch64).
3. Shape: **Ampere → VM.Standard.A1.Flex**, set **2 OCPUs / 12 GB RAM**
   (well within the free quota, and far easier to get than 4/24 — if you see
   *"Out of host capacity"*, retry later or try another availability domain).
4. Add your SSH public key (`cat ~/.ssh/id_ed25519.pub`).
5. Create, then note the **public IP**. Optional but recommended:
   Networking → reserve the public IP so it survives instance stop/start.

## 3. Open ports 80 and 443

Oracle blocks inbound traffic in **two** places; open both.

**a) Cloud firewall** — Instance → its subnet → **Security List** → Add
ingress rules: source `0.0.0.0/0`, TCP, destination ports `80` and `443`.

**b) On-VM firewall** — Oracle's Ubuntu images ship with restrictive
iptables rules. SSH in (`ssh ubuntu@<public-ip>`) and run:

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## 4. Get a free domain (DuckDNS)

1. Sign in at <https://www.duckdns.org>, create a subdomain
   (e.g. `mylab` → `mylab.duckdns.org`).
2. Set its IP to the VM's public IP. Done — no DNS records to manage.

## 5. Install Docker and run UXLab

On the VM:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit   # re-SSH so the group applies
```

```bash
git clone https://github.com/<you>/uxlab.git && cd uxlab
echo 'UXLAB_DOMAIN=mylab.duckdns.org' > .env
docker compose up -d --build
```

That's it. Caddy obtains a Let's Encrypt certificate automatically on first
request. Open `https://mylab.duckdns.org`, register your account, create a
study, launch it, and share `https://mylab.duckdns.org/p/<study-id>` with
participants anywhere in the world.

## 6. Backups (recommended)

Everything lives in one JSON file inside the `uxlab-data` volume. A nightly
copy into your home directory:

```bash
( crontab -l 2>/dev/null; echo '0 3 * * * docker compose -f ~/uxlab/docker-compose.yml cp uxlab:/app/data/db.json ~/uxlab-backup-$(date +\%a).json' ) | crontab -
```

This keeps 7 rotating daily backups (`Mon`…`Sun`). To restore — or to take
your data home — just copy a backup into `data/db.json` on any machine
running UXLab.

## Maintenance cheat-sheet

```bash
docker compose logs -f            # watch logs
docker compose up -d --build      # redeploy after a git pull
sudo apt update && sudo apt upgrade -y   # OS updates, monthly-ish
```

## Known free-tier gotchas

- **"Out of host capacity"** when creating the VM — region is busy. Use
  2 OCPU/12 GB, retry off-peak, or try a different availability domain.
- **Idle reclamation** — free-tier (non-upgraded) accounts can have idle VMs
  reclaimed after ~7 days of low use. Upgrading to Pay As You Go (step 1.3)
  prevents this. Your data is on a volume and survives either way.
- **IP changed after a stop/start** — you skipped the reserved-IP step;
  update the IP on duckdns.org and you're back.
