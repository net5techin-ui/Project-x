# TN28 Fashions Deployment Guide

To launch your website publicly with a domain and separate your panels, follow these steps:

### 1. Buy a Domain Name
- Go to a domain registrar like **GoDaddy**, **Namecheap**, or **Google Domains**.
- Search for and buy a domain like `tn28fashions.com`.

### 2. Get a Server (IP Address)
- Sign up for a VPS (Virtual Private Server) provider like **DigitalOcean**, **Hostinger**, or **AWS**.
- Create a "Droplet" or "Instance" using **Ubuntu**.
- You will receive an **IP Address** (e.g., `123.45.67.89`).

### 3. Connect Domain to IP
- In your Domain Registrar's dashboard, go to **DNS Settings**.
- Add an **A Record**:
    - **Host**: `@`
    - **Value**: `Your Server IP Address`
- Add another **A Record**:
    - **Host**: `www`
    - **Value**: `Your Server IP Address`

### 4. Upload Your Files
- Use a tool like **FileZilla** or **WinSCP** to connect to your server IP.
- Upload all files from your project folder into the server's web folder (usually `/var/www/html`).

### 5. Accessing Your Panels
- **Main Storefront**: `http://tn28fashions.com/` (Publicly accessible)
- **Admin Panel**: `http://tn28fashions.com/management-portal-9600.html` 
    - *Note: This link is hidden. Only people who know the exact name can find it.*

---

### Security Tip
To make the Admin Panel ONLY work from your specific IP address, you can configure your server (Nginx/Apache) to restrict access to the `management-portal-9600.html` file except for your own IP.
