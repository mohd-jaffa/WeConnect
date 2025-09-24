// const cron = require("node-cron");
// const dayjs = require("../utils/dayjs-setup");
// const Booking = require("../models/booking-model");

// cron.schedule("* * * * *", async () => {
//     try {
//         const nowUTC = dayjs().utc();

//         console.log(
//             `\n[CRON] Tick at UTC: ${nowUTC.format("YYYY-MM-DD HH:mm:ss")}`
//         );

//         // For ongoing bookings, check if end time is <= nowUTC
//         const ongoingBookings = await Booking.find({ status: "ongoing" });

//         const bookingsToComplete = ongoingBookings.filter((booking) => {
//             const endUTC = dayjs(booking.time.end).utc();
//             const shouldUpdate =
//                 endUTC.isSame(nowUTC) || endUTC.isBefore(nowUTC);
//             //   console.log(`[CHECK] Booking ${booking._id} end (UTC): ${endUTC.format("YYYY-MM-DD HH:mm:ss")} → Match: ${shouldUpdate}`);
//             return shouldUpdate;
//         });

//         if (bookingsToComplete.length > 0) {
//             const update = await Booking.updateMany(
//                 { _id: { $in: bookingsToComplete.map((b) => b._id) } },
//                 { $set: { status: "completed" } }
//             );
//             console.log(`[CRON] Completed ${update.modifiedCount} bookings.`);
//         } else {
//             console.log("[CRON] No ongoing bookings to complete.");
//         }

//         // For upcoming bookings, check if start time is <= nowUTC
//         const upcomingBookings = await Booking.find({ status: "upcoming" });

//         const bookingsToStart = upcomingBookings.filter((booking) => {
//             const startUTC = dayjs(booking.time.start).utc();
//             const shouldUpdate =
//                 startUTC.isSame(nowUTC) || startUTC.isBefore(nowUTC);
//             console.log(
//                 `[CHECK] Booking ${booking._id} start (UTC): ${startUTC.format(
//                     "YYYY-MM-DD HH:mm:ss"
//                 )} → Match: ${shouldUpdate}`
//             );
//             return shouldUpdate;
//         });

//         if (bookingsToStart.length > 0) {
//             const update = await Booking.updateMany(
//                 { _id: { $in: bookingsToStart.map((b) => b._id) } },
//                 { $set: { status: "ongoing" } }
//             );
//             console.log(`[CRON] Started ${update.modifiedCount} bookings.`);
//         } else {
//             console.log("[CRON] No upcoming bookings to start.");
//         }
//     } catch (error) {
//         console.error("[CRON ERROR]", error);
//     }
// });

//

// const cron = require("node-cron");
// const dayjs = require("../utils/dayjs-setup");
// const Booking = require("../models/booking-model");

// cron.schedule("* * * * *", async () => {
//     try {
//         const nowIST = dayjs().tz("Asia/Kolkata");

//         console.log(
//             `\n[CRON] Tick at IST: ${nowIST.format("YYYY-MM-DD HH:mm:ss")}`
//         );

//         const ongoingBookings = await Booking.find({ status: "ongoing" });
//         const bookingsToComplete = ongoingBookings.filter((booking) => {
//             const bookingEndIST = dayjs(booking.time.end).tz("Asia/Kolkata");
//             const shouldUpdate =
//                 bookingEndIST.isSame(nowIST) || bookingEndIST.isBefore(nowIST);
//             return shouldUpdate;
//         });
//         if (bookingsToComplete.length > 0) {
//             const update = await Booking.updateMany(
//                 { _id: { $in: bookingsToComplete.map((b) => b._id) } },
//                 { $set: { status: "completed" } }
//             );
//             console.log(`[CRON] Completed ${update.modifiedCount} bookings.`);
//         } else {
//             console.log("[CRON] No ongoing bookings to complete.");
//         }

//         const upcomingBookings = await Booking.find({ status: "upcoming" });
//         const bookingsToStart = upcomingBookings.filter((booking) => {
//             const bookingStartIST = dayjs(booking.time.start).tz(
//                 "Asia/Kolkata"
//             );
//             const shouldUpdate =
//                 bookingStartIST.isSame(nowIST) ||
//                 bookingStartIST.isBefore(nowIST);
//             return shouldUpdate;
//         });
//         if (bookingsToStart.length > 0) {
//             const update = await Booking.updateMany(
//                 { _id: { $in: bookingsToStart.map((b) => b._id) } },
//                 { $set: { status: "ongoing" } }
//             );
//             console.log(`[CRON] Started ${update.modifiedCount} bookings.`);
//         } else {
//             console.log("[CRON] No upcoming bookings to start.");
//         }
//     } catch (error) {
//         console.error("[CRON ERROR]", error);
//     }
// });

const cron = require("node-cron");
const dayjs = require("../utils/dayjs-setup");
const Booking = require("../models/booking-model");

cron.schedule("* * * * *", async () => {
    try {
        const nowIST = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DDTHH:mm:ss");
        console.log(`\n[CRON] Tick at IST: ${nowIST}`);
        const ongoingBookings = await Booking.find({ status: "ongoing" });
        const bookingsToComplete = ongoingBookings.filter((booking) => {
            const end = booking.time.end; // already string
            const shouldUpdate = end <= nowIST;
            return shouldUpdate;
        });
        if (bookingsToComplete.length > 0) {
            const update = await Booking.updateMany(
                { _id: { $in: bookingsToComplete.map((b) => b._id) } },
                { $set: { status: "completed" } }
            );
            console.log(`[CRON] Completed ${update.modifiedCount} bookings.`);
        } else {
            console.log("[CRON] No ongoing bookings to complete.");
        }
        const upcomingBookings = await Booking.find({ status: "upcoming" });
        const bookingsToStart = upcomingBookings.filter((booking) => {
            const start = booking.time.start; // already string
            const shouldUpdate = start <= nowIST;
            return shouldUpdate;
        });
        if (bookingsToStart.length > 0) {
            const update = await Booking.updateMany(
                { _id: { $in: bookingsToStart.map((b) => b._id) } },
                { $set: { status: "ongoing" } }
            );
            console.log(`[CRON] Started ${update.modifiedCount} bookings.`);
        } else {
            console.log("[CRON] No upcoming bookings to start.");
        }
    } catch (error) {
        console.error("[CRON ERROR]", error);
    }
});
