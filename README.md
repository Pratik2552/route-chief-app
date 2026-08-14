# CivicSync Driver App

Build ONLY the DRIVER MOBILE / FRONTEND of our CivicSync Smart Waste Management System.

IMPORTANT:

This is a separate driver-facing interface connected to the same CivicSync backend used by the Citizen and Admin frontends.

DO NOT change, remove, merge, rename, or add pages to the structure below.

==================================================

PROJECT IDENTITY

==================================================

Project:

CivicSync

Target Users:

Waste Collection Vehicle Drivers

Ground Field Staff

Primary Goal:

Provide drivers with a simple, highly usable interface for starting duty, viewing assigned routes, navigating between collection points, recording collections, uploading proof of work, and monitoring vehicle capacity.

==================================================

CRITICAL DESIGN DIRECTION

==================================================

The driver interface must NOT look like:

- AI software

- SaaS dashboard

- Analytics dashboard

- Complex enterprise software

It should feel like a:

SIMPLE MUNICIPAL FIELD-WORK APPLICATION.

The driver may be using the interface while:

- Standing beside a garbage truck

- Working outdoors

- In bright sunlight

- Using a mobile phone

- Having limited technical knowledge

Therefore prioritize:

- Large buttons

- Large text

- High contrast

- Clear status

- Minimal navigation

- One obvious action at a time

- Large map

- Minimal typing

- Minimal decorative UI

Do NOT use:

- Glassmorphism

- Neon effects

- AI gradients

- excessive cards

- complex animations

- tiny buttons

- dense analytics

Use a clean government/municipal field-service visual style.

==================================================

NAVIGATION

==================================================

Keep navigation extremely simple.

The driver should primarily move between:

Home

Navigation

Current Collection

Profile

Do not expose admin-level functionality.

==================================================

EXACT PAGE STRUCTURE

==================================================

PAGE 3.1 — DRIVER DUTY DASHBOARD & SHIFT START

Route:

/driver/home

Components:

1. DUTY STATUS

Large, obvious control:

ON DUTY

OFF DUTY

The current state should always be visible.

2. VEHICLE CAPACITY

Show a large visual meter:

Current Load / Maximum Capacity

Example:

750 kg / 1000 kg

Make the remaining capacity immediately understandable.

3. ASSIGNED ROUTE SUMMARY

Show:

- Total stops

- Estimated route distance

- Assigned territory

Keep this simple.

4. PRIMARY ACTION

If off duty:

"Start Duty"

If on duty:

"Start Route"

The driver should immediately know what action to take next.

==================================================

PAGE 3.2 — INTERACTIVE NAVIGATION

==================================================

Route:

/driver/navigation

This should be the MOST IMPORTANT driver screen.

The map should occupy most of the screen.

Components:

1. TURN-BY-TURN MAP

Use Leaflet/OSRM.

Route sequence:

Depot

→ Bin 1

→ Bin 2

→ Bin 3

→ ...

→ Depot

Show:

- Current vehicle position

- Route line

- Current destination

- Remaining stops

2. STOP-BY-STOP CHECKLIST

Show assigned bins sorted by collection priority.

Each stop should clearly display:

- Bin ID

- Location

- Priority

- Collection status

Statuses:

Pending

Current

Collected

3. GPS RE-ROUTE REQUEST

Provide a highly visible action:

"Request Re-route"

Use it if:

- Road blocked

- Traffic problem

- Road hazard

Do not hide this inside menus.

==================================================

PAGE 3.3 — BIN COLLECTION ACTION

==================================================

Route:

/driver/collect/:binId

This page should be extremely simple.

The driver should be able to complete a collection in a few actions.

Components:

1. BIN DETAILS

Show:

- Bin ID

- Address

- Current fill level

- Bin type

2. PHOTO VERIFICATION

Mandatory photo after emptying the bin.

Use camera-first design on mobile.

3. MARK AS COLLECTED

Large primary button:

"MARK AS COLLECTED"

When pressed:

- Update bin status

- Update collection record

- Adjust vehicle live load

- Move route to next stop

Do NOT make the driver navigate through several confirmation pages.

==================================================

PAGE 3.4 — DRIVER PROFILE & SUPPORT

==================================================

Route:

/driver/profile

Components:

1. PROFILE DETAILS

- Driver name

- Contact information

- License plate

- Assigned vehicle ID

2. DAILY EARNINGS / SHIFT HISTORY

Show:

- Completed routes

- Distance travelled

- Total tonnage cleared

Keep it simple.

==================================================

DRIVER WORKFLOW

==================================================

The complete driver journey should be:

LOGIN

↓

START DUTY

↓

VIEW ASSIGNED ROUTE

↓

START NAVIGATION

↓

ARRIVE AT BIN

↓

COLLECT WASTE

↓

TAKE PHOTO

↓

MARK COLLECTED

↓

NEXT BIN

↓

RETURN TO DEPOT

↓

END DUTY

The interface must visually support this sequence.

==================================================

IMPORTANT SAFETY / USABILITY PRINCIPLE

==================================================

The driver should NOT need to read long instructions while operating the vehicle.

Use:

- icons

- short labels

- large buttons

- obvious route information

Do not encourage interaction while driving.

The navigation screen should emphasize route information and safe operation.

==================================================

SYSTEM CONNECTION

==================================================

Driver data comes from the shared CivicSync backend.

The driver receives:

- Assigned route from Admin

- Assigned bins

- Priority order

- Vehicle information

The driver sends back:

- GPS position

- Collection status

- Collection photo

- Vehicle load updates

- Route progress

Admin should then see these updates in the Admin Dashboard.

Citizen should eventually see collection resolution through the shared system.

==================================================

FINAL DESIGN TEST

==================================================

Before considering the driver frontend complete:

1. Can a driver understand the next action immediately?

2. Can they start their shift easily?

3. Can they see their entire route?

4. Can they identify the next bin?

5. Can they mark collection quickly?

6. Can they upload proof easily?

7. Is the interface readable outdoors?

8. Is it mobile-first?

9. Is unnecessary information removed?

10. Are the exact required routes preserved?

DO NOT ADD NEW PAGES.

DO NOT CHANGE THE PROVIDED PAGE STRUCTURE.

DO NOT ADD ADMIN FEATURES.

DO NOT TURN THIS INTO AN ANALYTICS DASHBOARD.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://route-chief-app.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6c54ae87-57de-4a9f-8836-1a3ba2ec19e1).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
