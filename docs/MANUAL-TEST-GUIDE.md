# Manual test guide — Take & Bring Business

Database was wiped and reseeded. Use three browsers (or normal + two private windows) so sessions do not clash.

**App:** http://localhost:3001  
**Start:** `npm run dev`

| Role | Email | Password | Home |
|------|--------|----------|------|
| Admin | `admin@take-bring.eu` | `ChangeMeAdmin10!` | `/admin` |
| Shipper | `shipper@take-bring.eu` | `ChangeMeAdmin10!` | `/s` |
| Carrier (company admin) | `carrier@take-bring.eu` | `ChangeMeAdmin10!` | `/c` |

Optional automated check (needs app running):

```bash
npm run test:load-flow
```

---

## 0. Sanity

- [ ] Open `/login` — each account logs in and lands on the correct home
- [ ] Wrong password rejected
- [ ] Logout works

---

## 1. Marketplace loop (admin-mediated)

Current product rule: **admin publishes and awards**. Shipper does **not** accept bids. Escrow is paused (no Stripe fund step).

### A. Shipper creates a load

1. Login as **shipper** → `/s/loads/new`
2. Fill origin / destination / cargo / windows / budget
3. Submit (not draft-only)
4. Expect status **PENDING_ADMIN** (awaiting platform publish)
5. Open `/s/loads` — load visible for shipper

### B. Admin publishes

1. Login as **admin** → `/admin/loads` (filter “Awaiting publish”)
2. Open the load → **Publish**
3. Expect status **RECEIVING_OFFERS**
4. Carrier should get an in-app notification (bell / `/c` inbox)

### C. Carrier bids

1. Login as **carrier** → `/c/loads` (open board)
2. Confirm **shipper suggested price is hidden** (or not shown as binding)
3. Open load → submit bid with a price
4. Expect bid **PENDING**; load stays **RECEIVING_OFFERS**
5. Admin + shipper should see notifications / bid list

### D. Admin awards

1. **Admin** → load detail → award the carrier’s bid
2. Expect:
   - Winning bid **ACCEPTED**
   - Load **ASSIGNED**
   - Other bids (if any) **REJECTED**
   - **No escrow** created
3. Shipper + winning carrier notified

### E. Transit → deliver

1. **Carrier** → awarded load → set status **IN_TRANSIT**
2. Then **DELIVERED**
3. Admin/shipper load pages reflect status

---

## 2. Fleet (carrier company)

Only **CARRIER_COMPANY_ADMIN** sees `/c/fleet`.

1. Login as **carrier** → `/c/fleet`
2. **Add vehicle** (plate, class, label)
3. **Add driver** (name + email so a login user is created / linked)
4. Assign vehicle to driver if UI allows
5. After a load is **ASSIGNED**, use **assign fleet** (driver/vehicle on the won load) if that control is shown
6. Re-check load shows assigned driver

---

## 3. Live GPS (Traccar + Leaflet)

### A. Create GPS link

1. Carrier → `/c/fleet` → open driver → **Create GPS link**
2. Copy:
   - **Server URL** = `http://localhost:3001/api/location/ingest` (local)  
     Production: `https://YOUR_DOMAIN/api/location/ingest`
   - **Device identifier** = the secret token

### B. Phone (closed-app tracking)

1. Install [Traccar Client](https://www.traccar.org/client/)
2. Paste Server URL + Device identifier
3. Location **Always**, unrestricted battery, start service
4. Wait ~30–60s for pings

**Local caveat:** Traccar on a real phone cannot reach `localhost`. Use a tunnel (ngrok/Cloudflare) and set `NEXT_PUBLIC_APP_URL` to that public HTTPS origin before rotating the GPS link, **or** test ingest from a machine that can hit the server (step C).

### C. Fake ping without phone (API smoke)

Replace `TOKEN` with the device identifier:

```bash
curl "http://localhost:3001/api/location/ingest?id=TOKEN&lat=50.1109&lon=8.6821&timestamp=1710000000&speed=10"
```

Expect `{ "ok": true, ... }`.

### D. Maps

With load **ASSIGNED** / **IN_TRANSIT** / **DELIVERED** and a tracker user id:

- [ ] Admin load detail → **Live location** map
- [ ] Carrier load detail → map
- [ ] Shipper load detail → map
- [ ] `/c/fleet` → fleet live map (after at least one point)

Marker should move near Frankfurt (50.11, 8.68) after the curl above.

### E. PWA assist (TBD open)

1. Login as the **driver user** (or individual on active trip)
2. Keep TBD open while load is ASSIGNED/IN_TRANSIT
3. Browser should call `/api/location/update` (LocationTracker)
4. Map updates without Traccar

---

## 4. Negative / edge checks

- [ ] Carrier cannot bid before admin publish
- [ ] Shipper cannot award (admin-only accept)
- [ ] Double bid from same carrier rejected / blocked
- [ ] Driver role (if you create one) stays **off** the open bid board
- [ ] Invalid GPS token → ingest `401`
- [ ] Rotate GPS link → old token stops working; update Traccar with new id

---

## 5. Quick role checklist

| Surface | Must work |
|---------|-----------|
| `/admin/loads` | List, publish, award, live map |
| `/admin/kyc` | Opens (KYC hard-gate may still be backlog) |
| `/s/loads` | Create, view status, live map after award |
| `/c/loads` | Board, bid, transit statuses |
| `/c/fleet` | Vehicles, drivers, GPS link, fleet map |

---

## Reset again later

```bash
node scripts/wipe-db.mjs
npm run db:seed
```

Same three accounts as the table at the top.

---

## Suggested order (one sitting)

1. Sanity logins  
2. Full load loop shipper → admin publish → carrier bid → admin award → transit → delivered  
3. Fleet vehicle + driver  
4. GPS curl + maps  
5. Optional Traccar on phone via public tunnel  
6. `npm run test:load-flow` with `npm run dev` running  
