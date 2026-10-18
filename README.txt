SURAYYA FARHAT IMTIAZ — WEBSITE DEMO
====================================

HOW TO OPEN
-----------
Double-click  index.html  (works in Chrome, Edge, Safari, Firefox).
No install, no internet connection and no server needed. Fonts and icons are bundled.

ONE PAGE, TWO SIDES
-------------------
Use the switch at the bottom of the screen:
  - Customer site     what the boutique's customers see
  - Owner dashboard   what the owner / staff see
Anything a customer submits appears instantly in the dashboard (with a NEW tag),
and anything the owner changes shows up for the customer (e.g. order tracking).
"Reset demo data" in the dashboard sidebar returns everything to the starting state.

SUGGESTED 5-MINUTE PITCH FLOW
-----------------------------
1. Customer site > Rentals: open a dress, tap dates that are already booked to show the
   conflict warning and the suggested alternatives. Then pick free dates and send a request.
2. Customer site > Custom Stitching: submit the form, then "Track this order".
3. Switch to Owner dashboard: the Overview shows new items from the customer.
4. Rental requests: approve SFI-R-2047, then look at SFI-R-2048. It is now blocked
   (double-booking protection). Use "Offer alternative dates".
5. Availability calendar: one row per physical garment, with cleaning-day buffers.
6. Stitching orders: advance an order, then switch back to the customer site and
   track the same order number to show the live stage change.
7. Appointments and Stitching school: confirm a slot, accept an application
   (try a full course to show the capacity override).

WHAT IS DEMO-ONLY
-----------------
- Data lives in the browser's memory only (refresh = reset). The real system needs a database.
- Dress pictures are drawn placeholders; swap in real photography.
- Names, prices, testimonials, address and phone numbers are sample content.
- WhatsApp, payments and file uploads are simulated.

FILES
-----
index.html        page structure (customer site + dashboard)
css/styles.css    all styling
js/data.js        sample data and business settings (CFG: min days, cleaning buffer, delivery fee)
js/core.js        state and the availability / conflict engine
js/customer.js    customer-side features
js/admin.js       dashboard features
js/dress.js       placeholder dress illustrations
js/main.js        view switch and start-up
fonts/            bundled fonts (Cormorant Garamond, Jost)
