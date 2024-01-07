const db = require('../models');
const Appointment = db.appointment;
const { isBefore, setHours, setMinutes, setSeconds, addMinutes, setMilliseconds } = require('date-fns');

function formatName(name) {
    return name.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function generateAppointmentNumber() {
    let appointmentNumber;
    do {
        appointmentNumber = Math.floor(Math.random() * (10000 - 0 + 1) + 0).toString();
    } while (Appointment.findOne({ "appointment": { "$elemMatch": { "appointmentNumber": appointmentNumber } } }));
    return appointmentNumber;
}

function displaySlots(dayName) {
    const dayOfWeek = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const setTime = (date, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds, milliseconds);
    const today = new Date();
    const query = dayName;
    let match = "";

    for (let day in dayOfWeek) {
        if (day === query) {
            match = dayOfWeek[day];
        }
    }

    const first = today.getDate() - today.getDay() + match;
    const selectedDay = setTime(today, 0, 0, 0, first);

    const timeSlots = [];
    const setSlotTime = (date, hours) => setTime(date, hours, 0);
    const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

    let slotTime = setSlotTime(selectedDay, 9);
    while (slotTime.getHours() < 11) {
        timeSlots.push(slotTime);
        slotTime = addMinutes(slotTime, 30);
    }

    slotTime = setSlotTime(selectedDay, 13);
    while (slotTime.getHours() < 15) {
        timeSlots.push(slotTime);
        slotTime = addMinutes(slotTime, 30);
    }

    const formattedSlots = timeSlots.map(slot => slot.toLocaleString());
    const data = formattedSlots.map(slot => ({ appointmentDate: slot }));

    return data;
}

function displayNextWeekSlots(dayName) {
    // This function displays available slots of the day that the user selected as their preferred appointment date.
    const dayMappings = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const setTime = (date, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) =>
        new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, seconds, milliseconds);
    const today = new Date();
    const query = dayName;
    let match = "";

    for (let day in dayMappings) {
        if (day === query) {
            match = dayMappings[day];
        }
    }

    const first = today.getDate() - today.getDay() + match;
    const nextWeek = new Date(today.setDate(first) + 7 * 24 * 60 * 60 * 1000);

    const a = setTime(nextWeek, 9);
    const b = setTime(nextWeek, 11);
    const c = setTime(nextWeek, 13);
    const d = setTime(nextWeek, 15);
    const step = (time) => new Date(time.getTime() + 30 * 60 * 1000);

    const morningSlots = [];
    const afternoonSlots = [];
    let currentTime = a;
    let endTime = c;

    while (currentTime < b) {
        morningSlots.push(currentTime);
        currentTime = step(currentTime);
    }

    while (endTime < d) {
        afternoonSlots.push(endTime);
        endTime = step(endTime);
    }

    const daySlots = morningSlots.concat(afternoonSlots);

    const data = daySlots.map((slot) => ({ appointmentDate: slot.toLocaleString() }));

    return data;
}

function rescheduleDisplaySlots(date, dayName) {
    const dayToNumber = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const setTime = (x, h = 0, m = 0, s = 0, ms = 0) => setHours(setMinutes(setSeconds(setMilliseconds(x, ms), s), m), h);
    const today = new Date(date);
    const query = dayName;
    let match = "";
    let result = [];

    for (let day in dayToNumber) {
        if (day === query) {
            match = dayToNumber[day];
            break;
        }
    }

    const first = today.getDate() - today.getDay() + match;
    const day = new Date(today.setDate(first));

    const a = setTime(day, 9);
    const b = setTime(day, 11);
    const c = setTime(day, 13);
    const d = setTime(day, 15);
    const step = (x) => addMinutes(x, 30);

    const morning = [];
    const afternoon = [];
    let z = a;
    let y = c;

    while (isBefore(z, b)) {
        morning.push(z);
        z = step(z);
    }

    while (isBefore(y, d)) {
        afternoon.push(y);
        y = step(y);
    }

    const daySlots = morning.concat(afternoon);
    const formattedSlots = daySlots.map((slot) => slot.toLocaleString());
    const data = formattedSlots.map((item) => ({ appointmentDate: item }));

    return data;
}

function rescheduleNextWeekDisplaySlots(date, dayName) {
    const daysOfWeek = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const setTime = (date, hours = 0, minutes = 0, seconds = 0, milliseconds = 0) => {
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(seconds);
        date.setMilliseconds(milliseconds);
        return date;
    };

    const today = new Date(date);
    const query = dayName;
    let match = "";

    for (let day in daysOfWeek) {
        if (day === query) {
            match = daysOfWeek[day];
        }
    }

    const firstDayOfWeek = today.getDate() - today.getDay() + match;
    const nextWeek = new Date(today.setDate(firstDayOfWeek + 7));

    const a = setTime(new Date(nextWeek), 9);
    const b = setTime(new Date(nextWeek), 11);
    const c = setTime(new Date(nextWeek), 13);
    const d = setTime(new Date(nextWeek), 15);
    const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60000);

    const morning = [];
    const afternoon = [];
    let z = a;
    let y = c;

    while (z < b) {
        morning.push(z);
        z = addMinutes(z, 30);
    }

    while (y < d) {
        afternoon.push(y);
        y = addMinutes(y, 30);
    }

    const daySlots = [...morning, ...afternoon];
    const formattedSlots = daySlots.map(slot => slot.toLocaleString());
    const data = formattedSlots.map(item => ({ appointmentDate: item }));

    return data;
}

function getNextWeekDate(dayName) {
    const dayMapping = { "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    const match = dayMapping[dayName];
    const first = today.getDate() - today.getDay() + match;
    const nextWeek = new Date(today.setDate(first + 7));
  
    return nextWeek.toISOString().slice(0, 10);
}

function getRescheduleNextWeekDate(date, dayName) {
    const dayMap = {
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5
    };

    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    const match = dayMap[dayName];
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay() + match));
    const nextWeek = new Date(firstDay.getTime() + 7 * 24 * 60 * 60 * 1000);

    return nextWeek.toLocaleDateString();
}

function getDateRange(dayName) {
    const daysOfWeek = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    };

    const dateRange = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let match = daysOfWeek[dayName];

    const firstDayOfWeek = today.getDate() - today.getDay() + match;
    const lastDayOfWeek = today.getDate() - today.getDay() + match + 1;
    
    const startDate = new Date(today.setDate(firstDayOfWeek));
    const endDate = new Date(today.setDate(lastDayOfWeek));

    dateRange.push(startDate, endDate);

    const data = dateRange.slice(0, -1).map((item, index) => ({ startTime: item, endTime: dateRange[index + 1] }));

    return data;
}

function getNextWeekDateRange(dayName) {
    const dayMap = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    }

    const dateRange = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { getDate, getDay } = today;

    const match = dayMap[dayName];

    const first = getDate() - getDay() + match;
    const last = first + 1;

    const start = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    const end = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));

    dateRange.push(start, end);

    const data = dateRange.slice(0, -1).map((item, index) => ({ startTime: item, endTime: dateRange[index + 1] }));

    return data;
}

function getRescheduleDateRange(date, dayName) {
    const daysOfWeek = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    };

    const dateRange = [];

    // Get the selected day's index
    const selectedDayIndex = daysOfWeek[dayName];

    const today = new Date(date);
    today.setHours(0, 0, 0, 0);

    // Calculate the start and end dates for the selected day
    const firstDayOfCurrentWeek = today.getDate() - today.getDay();
    const start = new Date(today.setDate(firstDayOfCurrentWeek + selectedDayIndex));
    const end = new Date(today.setDate(firstDayOfCurrentWeek + selectedDayIndex + 1));

    dateRange.push(start, end);

    // Create an array of objects with startTime and endTime properties
    const data = dateRange.slice(0, -1).map((item, index) => ({ startTime: item, endTime: dateRange[index + 1] }));

    return data;
}

function getRescheduleNextWeekDateRange(date, dayName) {
  const daysOfWeek = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
  };

  const dateRange = [];

  const query = dayName;
  const today = new Date(date);
  today.setHours(0, 0, 0, 0);

  let match = "";

  for (let day in daysOfWeek) {
    if (day === query) {
      match = daysOfWeek[day];
    }
  }

  const firstDay = today.getDate() - today.getDay() + match;
  const lastDay = firstDay + 1;
  const start = new Date(today.setDate(firstDay) + 7 * 24 * 60 * 60 * 1000);
  const end = new Date(today.setDate(lastDay) + 7 * 24 * 60 * 60 * 1000);

  dateRange.push(start, end);

  const data = dateRange.slice(0, -1).map((item, index) => ({
    startTime: item,
    endTime: dateRange[index + 1]
  }));

  return data;
}

function convertToISOFormat(dayName, isNextWeek, slot) {
    const daysOfWeek = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let dayIndex = -1;
    for (const day in daysOfWeek) {
        if (day === dayName) {
            dayIndex = daysOfWeek[day];
            break;
        }
    }

    const first = today.getDate() - today.getDay() + dayIndex;
    const selectedDay = new Date(today.setDate(first));

    let selectedDate;
    if (isNextWeek === "No") {
        selectedDate = new Date(selectedDay).toLocaleDateString();
    } else if (isNextWeek === "Yes") {
        selectedDate = new Date(getNextWeekDate(dayName)).toLocaleDateString();
    }

    const combinedString = selectedDate.concat(' ', slot);
    const formattedDate = new Date(combinedString).toLocaleString();

    return formattedDate;
}

function convertRescheduleDateToISOFormat(dayName, isNextWeek, slot, date) {
    const daysOfWeek = {
        "Sunday": 0,
        "Monday": 1,
        "Tuesday": 2,
        "Wednesday": 3,
        "Thursday": 4,
        "Friday": 5,
        "Saturday": 6
    }

    const queryDay = dayName;
    const nextWeek = isNextWeek;
    const querySlot = slot;
    const queryDate = date;
    
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    let match = '';

    for (let day in daysOfWeek) {
        if (day === queryDay) {
            match = daysOfWeek[day];
        }
    }

    const first = today.getDate() - today.getDay() + match;
    const rescheduledDate = new Date(today.setDate(first));

    if (nextWeek === "No") {
        const myDateString = new Date(rescheduledDate).toLocaleDateString();
        const combinedString = `${myDateString} ${querySlot}`;
        const concatDate = new Date(combinedString).toLocaleString();

        return concatDate;
    } else if (nextWeek === "Yes") {
        const myDateString = new Date(getRescheduleNextWeekDate(queryDate, queryDay)).toLocaleDateString();
        const combinedString = `${myDateString} ${querySlot}`;
        const concatDate = new Date(combinedString).toLocaleString();

        return concatDate;
    }
}

module.exports = { displaySlots, displayNextWeekSlots, rescheduleDisplaySlots, rescheduleNextWeekDisplaySlots, generateAppointmentNumber, getDateRange, getNextWeekDateRange, getRescheduleDateRange, getRescheduleNextWeekDateRange, convertToISOFormat, convertRescheduleDateToISOFormat, formatName };