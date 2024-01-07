const db = require("../models");
const {
  generateAppointmentNumber,
  displaySlots,
  displayNextWeekSlots,
  rescheduleDisplaySlots,
  rescheduleNextWeekDisplaySlots,
  getDateRange,
  getNextWeekDateRange,
  getRescheduleDateRange,
  getRescheduleNextWeekDateRange,
  convertToISOFormat,
  convertRescheduleDateToISOFormat,
  formatName,
} = require("../utils/scripts");
var mongoose = require("mongoose");
const Doctor = db.doctor;
const Appointment = db.appointment;
const AppointmentBackUp = db.appointmentbackup;
const Announcement = db.announcement;
const Information = db.information;

exports.main = async (req, res) => {
  const psid = req.body.originalDetectIntentRequest.payload.data.sender.id;
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const objDate = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
  };
  const dateObj = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
  };
  const endreply = [
    {
      title: "Latest Announcement",
      payload: "Get Announcements",
      content_type: "text",
    },
    {
      title: "General Information",
      payload: "General Information",
      content_type: "text",
    },
    {
      content_type: "text",
      payload: "Book Appointment",
      title: "Book Appointment",
    },
    {
      payload: "Check Appointment Status",
      title: "Check Appointment Status",
      content_type: "text",
    },
    {
      payload: "Cancel Appointment",
      content_type: "text",
      title: "Cancel Appointment",
    },
    {
      title: "Reschedule Appointment",
      content_type: "text",
      payload: "Reschedule Appointment",
    },
    {
      payload: "Check Doctor Status",
      content_type: "text",
      title: "Check Doctor Status",
    },
  ];

  if (req.body.queryResult.parameters.informationType == "appointmentNew") {
    Appointment.find(
      { psid: psid },
      { psid: 1, fullName: 1, _id: 0 },
      (err, data) => {
        if (Object.keys(data).length > 0) {
          //User already has account
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text:
                      "You already have an account Mr/Mrs. " +
                      data[0].fullName +
                      ". Would you like to proceed to appointment booking?",
                    quick_replies: [
                      {
                        content_type: "text",
                        title: "Yes",
                        payload: "appointmentOld",
                      },
                      {
                        content_type: "text",
                        title: "No",
                        payload: "cancelIntent",
                      },
                    ],
                  },
                },
              },
            ],
          });
        } else {
          //No account found
          Doctor.find({}, { doctorName: 1, _id: 0 }, (err, result) => {
            if (err) {
              console.log(err);
              return res.json({
                fulfillmentText: "Something went wrong.",
              });
            } else {
              const finalObj = {
                fulfillmentMessages: [
                  {
                    payload: {
                      facebook: {
                        text: "Please select your preferred doctor.",
                        quick_replies: [],
                      },
                    },
                  },
                ],
              };
              for (let element of result) {
                const obj = {
                  content_type: "text",
                  title: element.doctorName,
                  payload: element.doctorName,
                };
                finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                  obj
                );
              }
              return res.json(finalObj);
            }
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "appointmentOld"
  ) {
    Appointment.find({ psid: psid }, (err, result) => {
      if (!result || !result.length) {
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: "Good day, you don't have an account yet. Before we can proceed to appointment booking, you'll need to create a new account first.",
                  quick_replies: [
                    {
                      content_type: "text",
                      title: "Create Account",
                      payload: "appointmentNew",
                    },
                    {
                      content_type: "text",
                      title: "Go Back",
                      payload: "cancelIntent",
                    },
                  ],
                },
              },
            },
          ],
        });
      }

      if (Object.keys(result[0].appointment).length >= 3) {
        // Check if user has 3 active/pending appointments
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text:
                    "You already have three active/pending appointments Mr/Mrs. " +
                    result[0].fullName +
                    ". We only limit our clients to three appointments.",
                  quick_replies: endreply,
                },
              },
            },
          ],
        });
      }

      if (Object.keys(result).length > 0) {
        Doctor.find({}, { doctorName: 1, _id: 0 }, (err, result) => {
          if (err) {
            return res.json({
              fulfillmentText: "Something went wrong.",
            });
          } else {
            const finalObj = {
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text: "Please select your preferred doctor.",
                      quick_replies: [],
                    },
                  },
                },
              ],
            };
            for (let element of result) {
              const obj = {
                content_type: "text",
                title: element.doctorName,
                payload: element.doctorName,
              };
              finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                obj
              );
            }
            return res.json(finalObj);
          }
        });
      }
    });
    /// old code
  } else if (
    req.body.queryResult.parameters.informationType == "doctorSelect"
  ) {
    return res.json({
      fulfillmentMessages: [
        {
          payload: {
            facebook: {
              text: "Would you like to book for this week or next week?",
              quick_replies: [
                {
                  content_type: "text",
                  title: "Book This Week",
                  payload: "thisWeekBook",
                },
                {
                  content_type: "text",
                  title: "Book Next Week",
                  payload: "nextWeekBook",
                },
              ],
            },
          },
        },
      ],
    });
  } else if (
    req.body.queryResult.parameters.informationType == "thisWeekBook"
  ) {
    //Display available day for this week
    const finalObj = {
      fulfillmentMessages: [
        {
          payload: {
            facebook: {
              text: "Please pick your preferred appointment day.",
              quick_replies: [],
            },
          },
        },
      ],
    };

    const today = new Date();
    const d = today.getDay();

    if (d === 5) {
      return res.json({
        fulfillmentMessages: [
          {
            payload: {
              facebook: {
                text: "Sorry, today is the last day of the week. Would you like to book for next week instead?",
                quick_replies: [
                  {
                    content_type: "text",
                    title: "Yes",
                    payload: "nextWeekBook",
                  },
                  {
                    content_type: "text",
                    title: "No",
                    payload: "cancelIntent",
                  },
                ],
              },
            },
          },
        ],
      });
    } else {
      for (const [key, value] of Object.entries(dateObj)) {
        if (d < value) {
          const obj = {
            content_type: "text",
            title: key,
            payload: key,
          };
          finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
            obj
          );
        }
      }
    }
    return res.json(finalObj);
  } else if (
    req.body.queryResult.parameters.informationType == "nextWeekBook"
  ) {
    //Display available day for next week
    const finalObj = {
      fulfillmentMessages: [
        {
          payload: {
            facebook: {
              text: "Please pick your preferred appointment day.",
              quick_replies: [],
            },
          },
        },
      ],
    };

    for (const [key, value] of Object.entries(dateObj)) {
      const obj = {
        content_type: "text",
        title: key,
        payload: key,
      };
      finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(obj);
    }
    return res.json(finalObj);
  } else if (req.body.queryResult.parameters.informationType == "daySelect") {
    const isthisReschedule =
      req.body.queryResult.outputContexts[0].parameters.isthisReschedule;
    // Validate if day selected is not before. Otherwise prompt user if they want to book for next week or cancel appointment.
    if (isthisReschedule == "Yes") {
      const appointmentNumber =
        req.body.queryResult.outputContexts[0].parameters.appointmentNumber;

      Appointment.find(
        { psid: psid },
        {
          appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
          psid: 1,
          fullName: 1,
          _id: 0,
        },
        (err, result) => {
          var date = new Date(result[0].appointment[0].appointmentDate),
            match = "";
          const dayName =
            req.body.queryResult.outputContexts[0].parameters.dayName;
          const isthisNextWeek =
            req.body.queryResult.outputContexts[0].parameters.isthisNextWeek;

          for (let element in objDate) {
            if (element == dayName) {
              match = objDate[element];
            }
          }

          if (isthisNextWeek === "Yes") {
            slots = rescheduleNextWeekDisplaySlots(date, match);
            dateRange = getRescheduleNextWeekDateRange(date, match);

            Appointment.aggregate(
              [
                {
                  $unwind: "$appointment",
                },
                {
                  $match: {
                    "appointment.doctorName":
                      result[0].appointment[0].doctorName,
                    "appointment.appointmentStatus": "Active",
                    "appointment.appointmentDate": {
                      $gte: dateRange[0].startTime,
                      $lt: dateRange[0].endTime,
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    appointmentDate: "$appointment.appointmentDate",
                  },
                },
              ],
              (err, dbSlots) => {
                const result = [];
                const dbISOSlots = [];
                const finalObj = {
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text: "Please pick your preferred appointment time.",
                          quick_replies: [],
                        },
                      },
                    },
                  ],
                };

                for (let element of dbSlots) {
                  dbISOSlots.push(element.appointmentDate.toLocaleString());
                }

                var dbStringSlots = dbISOSlots
                  .slice(0)
                  .map((item) => ({ appointmentDate: item }));

                const availableDateSlots = slots.filter(
                  ({ appointmentDate: id1 }) =>
                    !dbStringSlots.some(
                      ({ appointmentDate: id2 }) => id2 === id1
                    )
                );

                for (let element of availableDateSlots) {
                  const time = new Date(
                    element.appointmentDate
                  ).toLocaleTimeString("en", {
                    timeStyle: "short",
                    hour12: true,
                  });
                  result.push(time);
                }

                if (result.length < 0) {
                  return res.json({
                    fulfillmentText: "Sorry, there is no available slots.",
                  });
                } else {
                  for (var i = 0; i < result.length; i++) {
                    const obj = {
                      content_type: "text",
                      title: result[i],
                      payload: result[i],
                    };
                    finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                      obj
                    );
                  }
                }
                return res.json(finalObj);
              }
            );
          } else {
            slots = rescheduleDisplaySlots(date, match);
            dateRange = getRescheduleDateRange(date, match);
            // Add query with date range
            Appointment.aggregate(
              [
                {
                  $unwind: "$appointment",
                },
                {
                  $match: {
                    "appointment.doctorName":
                      result[0].appointment[0].doctorName,
                    "appointment.appointmentStatus": "Active",
                    "appointment.appointmentDate": {
                      $gte: dateRange[0].startTime,
                      $lt: dateRange[0].endTime,
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    appointmentDate: "$appointment.appointmentDate",
                  },
                },
              ],
              (err, dbSlots) => {
                const result = [];
                const dbISOSlots = [];
                const finalObj = {
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text: "Please pick your preferred appointment time.",
                          quick_replies: [],
                        },
                      },
                    },
                  ],
                };

                for (let element of dbSlots) {
                  dbISOSlots.push(element.appointmentDate.toLocaleString());
                }

                var dbStringSlots = dbISOSlots
                  .slice(0)
                  .map((item) => ({ appointmentDate: item }));
                const availableDateSlots = slots.filter(
                  ({ appointmentDate: id1 }) =>
                    !dbStringSlots.some(
                      ({ appointmentDate: id2 }) => id2 === id1
                    )
                );

                for (let element of availableDateSlots) {
                  const time = new Date(
                    element.appointmentDate
                  ).toLocaleTimeString("en", {
                    timeStyle: "short",
                    hour12: true,
                  });
                  result.push(time);
                }

                if (result.length < 0) {
                  return res.json({
                    fulfillmentText: "Sorry, there is no available slots.",
                  });
                } else {
                  for (var i = 0; i < result.length; i++) {
                    const obj = {
                      content_type: "text",
                      title: result[i],
                      payload: result[i],
                    };
                    finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                      obj
                    );
                  }
                }
                return res.json(finalObj);
              }
            );
          }
        }
      );
    } else {
      const query = req.body.queryResult.outputContexts[0].parameters.dayName;
      const doctorName =
        req.body.queryResult.outputContexts[0].parameters.doctorName;
      var slots, dateRange;

      if (
        req.body.queryResult.outputContexts[0].parameters.isthisNextWeek ===
        "Yes"
      ) {
        slots = displayNextWeekSlots(query);
        dateRange = getNextWeekDateRange(query);

        Appointment.aggregate(
          [
            {
              $unwind: "$appointment",
            },
            {
              $match: {
                "appointment.doctorName": doctorName,
                "appointment.appointmentStatus": "Active",
                "appointment.appointmentDate": {
                  $gte: dateRange[0].startTime,
                  $lt: dateRange[0].endTime,
                },
              },
            },
            {
              $project: {
                _id: 0,
                appointmentDate: "$appointment.appointmentDate",
              },
            },
          ],
          (err, dbSlots) => {
            const result = [];
            const dbISOSlots = [];
            const finalObj = {
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text: "Please pick your preferred appointment time.",
                      quick_replies: [],
                    },
                  },
                },
              ],
            };

            for (let element of dbSlots) {
              dbISOSlots.push(element.appointmentDate.toLocaleString());
            }

            var dbStringSlots = dbISOSlots
              .slice(0)
              .map((item) => ({ appointmentDate: item }));

            const availableDateSlots = slots.filter(
              ({ appointmentDate: id1 }) =>
                !dbStringSlots.some(({ appointmentDate: id2 }) => id2 === id1)
            );

            for (let element of availableDateSlots) {
              const time = new Date(element.appointmentDate).toLocaleTimeString(
                "en",
                { timeStyle: "short", hour12: true }
              );
              result.push(time);
            }

            if (result.length < 0) {
              return res.json({
                fulfillmentText: "Sorry, there is no available slots.",
              });
            } else {
              for (var i = 0; i < result.length; i++) {
                const obj = {
                  content_type: "text",
                  title: result[i],
                  payload: result[i],
                };
                finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                  obj
                );
              }
            }
            return res.json(finalObj);
          }
        );
      } else {
        slots = displaySlots(query);
        dateRange = getDateRange(query);
        // Add query with date range
        Appointment.aggregate(
          [
            {
              $unwind: "$appointment",
            },
            {
              $match: {
                "appointment.doctorName": doctorName,
                "appointment.appointmentStatus": "Active",
                "appointment.appointmentDate": {
                  $gte: dateRange[0].startTime,
                  $lt: dateRange[0].endTime,
                },
              },
            },
            {
              $project: {
                _id: 0,
                appointmentDate: "$appointment.appointmentDate",
              },
            },
          ],
          (err, dbSlots) => {
            const result = [];
            const dbISOSlots = [];
            const finalObj = {
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text: "Please pick your preferred appointment time.",
                      quick_replies: [],
                    },
                  },
                },
              ],
            };

            for (let element of dbSlots) {
              dbISOSlots.push(element.appointmentDate.toLocaleString());
            }

            var dbStringSlots = dbISOSlots
              .slice(0)
              .map((item) => ({ appointmentDate: item }));
            const availableDateSlots = slots.filter(
              ({ appointmentDate: id1 }) =>
                !dbStringSlots.some(({ appointmentDate: id2 }) => id2 === id1)
            );

            for (let element of availableDateSlots) {
              const time = new Date(element.appointmentDate).toLocaleTimeString(
                "en",
                { timeStyle: "short", hour12: true }
              );
              result.push(time);
            }

            if (result.length < 0) {
              return res.json({
                fulfillmentText: "Sorry, there is no available slots.",
              });
            } else {
              for (var i = 0; i < result.length; i++) {
                const obj = {
                  content_type: "text",
                  title: result[i],
                  payload: result[i],
                };
                finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
                  obj
                );
              }
            }

            return res.json(finalObj);
          }
        );
      }
    }
  } else if (req.body.queryResult.parameters.informationType == "slotSelect") {
    const isthisReschedule =
      req.body.queryResult.outputContexts[0].parameters.isthisReschedule;

    if (isthisReschedule == "Yes") {
      return res.json({
        fulfillmentMessages: [
          {
            payload: {
              facebook: {
                text: "Would you like to confirm your appointment reschedule?",
                quick_replies: [
                  {
                    content_type: "text",
                    title: "Yes",
                    payload: "confirmAppointment",
                  },
                  {
                    content_type: "text",
                    title: "No",
                    payload: "cancelIntent",
                  },
                ],
              },
            },
          },
        ],
      });
    } else {
      return res.json({
        fulfillmentMessages: [
          {
            payload: {
              facebook: {
                text: "Would you like to confirm your appointment?",
                quick_replies: [
                  {
                    content_type: "text",
                    title: "Yes",
                    payload: "confirmAppointment",
                  },
                  {
                    content_type: "text",
                    title: "No",
                    payload: "cancelIntent",
                  },
                ],
              },
            },
          },
        ],
      });
    }
  } else if (req.body.queryResult.parameters.informationType == "confirmSlot") {
    const isthisNextWeek =
      req.body.queryResult.outputContexts[0].parameters.isthisNextWeek;
    const isthisReschedule =
      req.body.queryResult.outputContexts[0].parameters.isthisReschedule;
    if (isthisReschedule == "Yes") {
      const dayName = req.body.queryResult.outputContexts[0].parameters.dayName;
      const isthisNextWeek =
        req.body.queryResult.outputContexts[0].parameters.isthisNextWeek;
      const slot = req.body.queryResult.outputContexts[0].parameters.timeSlot;
      const appointmentNumber =
        req.body.queryResult.outputContexts[0].parameters.appointmentNumber;

      Appointment.findOne(
        { psid: psid },
        {
          appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
          psid: 1,
          fullName: 1,
          _id: 0,
        },
        (err, data) => {
          const date = data.appointment[0].appointmentDate;

          if (data.appointment[0].rescheduleCount == 3) {
            return res.json({
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text: "Sorry, you cannot reschedule anymore. You can only reschedule three times.",
                      quick_replies: endreply,
                    },
                  },
                },
              ],
            });
          } else {
            Appointment.findOneAndUpdate(
              {
                psid: psid,
                appointment: {
                  $elemMatch: { appointmentNumber: appointmentNumber },
                },
              },
              {
                $set: {
                  "appointment.$.appointmentDate":
                    convertRescheduleDateToISOFormat(
                      dayName,
                      isthisNextWeek,
                      slot,
                      date
                    ),
                  $inc: { "appointment.$.rescheduleCount": 1 },
                },
              },
              { new: true },
              (err, result) => {
                if (Object.keys(result).length > 0) {
                  return res.json({
                    fulfillmentMessages: [
                      {
                        payload: {
                          facebook: {
                            text:
                              "Good day Mr/Ms. " +
                              result.fullName +
                              ". Your appointment has been updated to " +
                              result.appointment[0].appointmentDate.toLocaleDateString(
                                undefined,
                                options
                              ) +
                              " " +
                              slot +
                              ".",
                            quick_replies: endreply,
                          },
                        },
                      },
                    ],
                  });
                } else {
                  return res.json({
                    fulfillmentMessages: [
                      {
                        payload: {
                          facebook: {
                            text: "Sorry, we cannot update your schedule.",
                            quick_replies: endreply,
                          },
                        },
                      },
                    ],
                  });
                }
              }
            );
          }
        }
      );
    } else {
      const doctorName =
        req.body.queryResult.outputContexts[0].parameters.doctorName;
      const fullName =
        req.body.queryResult.outputContexts[0].parameters.fullName;
      const dayName = req.body.queryResult.outputContexts[0].parameters.dayName;
      const timeSlot =
        req.body.queryResult.outputContexts[0].parameters.timeSlot;

      Appointment.find({ psid: psid }, (err, result) => {
        if (Object.keys(result).length > 0) {
          const appointment = {
            appointmentNumber: generateAppointmentNumber(),
            doctorName: doctorName,
            appointmentDate: convertToISOFormat(
              dayName,
              isthisNextWeek,
              timeSlot
            ),
            appointmentStatus: "Pending",
          };

          Appointment.updateOne(
            { psid: psid },
            { $push: { appointment: appointment } },
            (err, data) => {
              if (isthisNextWeek === "No") {
                if (err) {
                  return res.json({
                    fulfillmentText: "Something went wrong.",
                  });
                } else {
                  return res.json({
                    fulfillmentMessages: [
                      {
                        payload: {
                          facebook: {
                            text:
                              "Mr/Mrs. " +
                              result[0].fullName +
                              ", you have set an appointment this week on " +
                              dayName +
                              " " +
                              timeSlot +
                              ". You can check your appointment status with this ID number: " +
                              appointment.appointmentNumber +
                              "." +
                              "\n  \n" +
                              "You will be notified once your appointment has been approved. Thank you for choosing Urgent Care Clinic.",
                            quick_replies: endreply,
                          },
                        },
                      },
                    ],
                  });
                }
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Mr/Mrs. " +
                            result[0].fullName +
                            ", you have set an appointment next week on " +
                            dayName +
                            " " +
                            timeSlot +
                            ". You can check your appointment status with this ID number: " +
                            appointment.appointmentNumber +
                            "." +
                            "\n  \n" +
                            "You will be notified once your appointment has been approved. Thank you for choosing Urgent Care Clinic.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            }
          );
        } else {
          const user = {
            psid: req.body.originalDetectIntentRequest.payload.data.sender.id,
            fullName: formatName(fullName),
            appointment: [
              {
                appointmentNumber: generateAppointmentNumber(),
                doctorName: doctorName,
                appointmentDate: convertToISOFormat(
                  dayName,
                  isthisNextWeek,
                  timeSlot
                ),
                appointmentStatus: "Pending",
              },
            ],
          };

          if (isthisNextWeek === "No") {
            Appointment.create(user, (err, result) => {
              if (err) {
                return res.json({
                  fulfillmentText: "Something went wrong.",
                });
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Mr/Mrs. " +
                            user.fullName +
                            ", you have set an appointment this week on " +
                            dayName +
                            " " +
                            timeSlot +
                            ". You can check your appointment status with this ID number: " +
                            user.appointment[0].appointmentNumber +
                            "." +
                            "\n  \n" +
                            "You will be notified once your appointment has been approved. Thank you for choosing Urgent Care Clinic.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            });
          } else {
            Appointment.create(user, (err, result) => {
              if (err) {
                return res.json({
                  fulfillmentText: "Something went wrong.",
                });
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Mr/Mrs. " +
                            user.fullName +
                            ", you have set an appointment for next week on " +
                            dayName +
                            " " +
                            timeSlot +
                            ". You can check your appointment status with this ID number: " +
                            user.appointment[0].appointmentNumber +
                            "." +
                            "\n  \n" +
                            "You will be notified once your appointment has been approved. Thank you for choosing Urgent Care Clinic.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            });
          }
        }
      });
    }
  } else if (
    req.body.queryResult.parameters.informationType == "checkActiveAppointments"
  ) {
    const psid = req.body.originalDetectIntentRequest.payload.data.sender.id;
    Appointment.find(
      { psid: psid },
      { psid: 1, fullName: 1, _id: 0 },
      (err, data) => {
        if (Object.keys(data).length > 0) {
          Appointment.aggregate(
            [
              {
                $match: {
                  psid: psid,
                },
              },
              {
                $unwind: "$appointment",
              },
              {
                $match: {
                  "appointment.appointmentStatus": "Active",
                },
              },
              {
                $sort: {
                  "appointment.appointmentDate": 1,
                },
              },
              {
                $project: {
                  _id: 0,
                  appointmentDate: "$appointment.appointmentDate",
                  appointmentNumber: "$appointment.appointmentNumber",
                  fullName: "$fullName",
                },
              },
            ],
            (err, result) => {
              if (Object.keys(result).length > 0) {
                var active = [];
                var count = 1;

                for (var i = 0; i < result.length; i++) {
                  active.push(
                    count +
                      ". " +
                      result[i].appointmentDate.toLocaleDateString(
                        undefined,
                        options
                      ) +
                      ". \n"
                  );
                  count++;
                }
                const data = active.join("");

                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Good day Mr/Ms. " +
                            result[0].fullName +
                            ", you currently have " +
                            Object.keys(result).length +
                            " active appointments:" +
                            " \n \n " +
                            data,
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text: "Good day, you currently have no active appointments.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            }
          );
        } else {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text: "Good day, you don't have an account yet. Please book an appointment first.",
                    quick_replies: endreply,
                  },
                },
              },
            ],
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType ==
    "checkPendingAppointments"
  ) {
    const psid = req.body.originalDetectIntentRequest.payload.data.sender.id;

    Appointment.find(
      { psid: psid },
      { psid: 1, fullName: 1, _id: 0 },
      (err, data) => {
        if (Object.keys(data).length > 0) {
          Appointment.aggregate(
            [
              {
                $match: {
                  psid: psid,
                },
              },
              {
                $unwind: "$appointment",
              },
              {
                $match: {
                  "appointment.appointmentStatus": "Pending",
                },
              },
              {
                $sort: {
                  "appointment.appointmentDate": 1,
                },
              },
              {
                $project: {
                  _id: 0,
                  appointmentDate: "$appointment.appointmentDate",
                  appointmentNumber: "$appointment.appointmentNumber",
                  fullName: "$fullName",
                },
              },
            ],
            (err, result) => {
              if (Object.keys(result).length > 0) {
                var active = [];
                var count = 1;

                for (var i = 0; i < result.length; i++) {
                  active.push(
                    count +
                      ". " +
                      result[i].appointmentDate.toLocaleDateString(
                        undefined,
                        options
                      ) +
                      ". \n"
                  );
                  count++;
                }
                const data = active.join("");

                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Good day Mr/Ms. " +
                            result[0].fullName +
                            ", you currently have " +
                            Object.keys(result).length +
                            " pending appointments:" +
                            " \n \n " +
                            data,
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text: "Good day, you currently have no pending appointments.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            }
          );
        } else {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text: "Good day, you don't have an account yet. Please book an appointment first.",
                    quick_replies: endreply,
                  },
                },
              },
            ],
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "checkAppointmentHistory"
  ) {
    const psid = req.body.originalDetectIntentRequest.payload.data.sender.id;

    Appointment.find(
      { psid: psid },
      { psid: 1, fullName: 1, _id: 0 },
      (err, data) => {
        if (Object.keys(data).length > 0) {
          AppointmentBackUp.aggregate(
            [
              {
                $match: {
                  psid: psid,
                },
              },
              {
                $unwind: "$appointment",
              },
              {
                $sort: {
                  "appointment.appointmentDate": 1,
                },
              },
              {
                $project: {
                  _id: 0,
                  appointmentDate: "$appointment.appointmentDate",
                  appointmentStatus: "$appointment.appointmentStatus",
                  fullName: "$fullName",
                },
              },
            ],
            (err, result) => {
              if (Object.keys(result).length > 0) {
                var active = [];
                var count = 1;

                for (var i = 0; i < result.length; i++) {
                  active.push(
                    count +
                      ". " +
                      result[i].appointmentDate.toLocaleDateString(
                        undefined,
                        options
                      ) +
                      " - " +
                      result[i].appointmentStatus +
                      ". \n"
                  );
                  count++;
                }
                const data = active.join("");

                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text:
                            "Good day Mr/Ms. " +
                            result[0].fullName +
                            ", here is your appointment history:" +
                            " \n \n " +
                            data,
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              } else {
                return res.json({
                  fulfillmentMessages: [
                    {
                      payload: {
                        facebook: {
                          text: "Good day, you currently have no previous appointments.",
                          quick_replies: endreply,
                        },
                      },
                    },
                  ],
                });
              }
            }
          );
        } else {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text: "Good day, you don't have an account yet. Please book an appointment first.",
                    quick_replies: endreply,
                  },
                },
              },
            ],
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "cancelAppointment"
  ) {
    const appointmentNumber = req.body.queryResult.parameters.appointmentNumber;

    Appointment.find(
      { psid: psid },
      {
        appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
        psid: 1,
        fullName: 1,
        _id: 0,
      },
      (err, result) => {
        if (Object.keys(result).length > 0) {
          const date = result[0].appointment[0].appointmentDate;
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text:
                      "Good day Mr/Ms. " +
                      result[0].fullName +
                      ". Do you want to cancel the appointment you scheduled on " +
                      date.toLocaleDateString(undefined, options) +
                      "?",
                    quick_replies: [
                      {
                        content_type: "text",
                        title: "Yes",
                        payload: "confirmCancelAppointment",
                      },
                      {
                        content_type: "text",
                        title: "No",
                        payload: "cancelIntent",
                      },
                    ],
                  },
                },
              },
            ],
          });
        } else {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text: "Good day, there are no active/pending appointments with the appointment number you have provided.",
                    quick_replies: endreply,
                  },
                },
              },
            ],
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType ==
    "confirmCancelAppointment"
  ) {
    const appointmentNumber =
      req.body.queryResult.outputContexts[0].parameters.appointmentNumber;
    Appointment.find(
      { psid: psid },
      {
        appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
        psid: 1,
        fullName: 1,
        _id: 0,
      },
      (err, result) => {
        result[0].appointment[0].appointmentStatus = "Cancelled";
        const oldAppointment = {
          psid: result[0].psid,
          fullName: result[0].fullName,
          appointmentNumber: result[0].appointment[0].appointmentNumber,
          doctorName: result[0].appointment[0].doctorName,
          appointmentDate: result[0].appointment[0].appointmentDate,
          appointmentStatus: result[0].appointment[0].appointmentStatus,
          createdAt: new Date(),
          _id: mongoose.Types.ObjectId(),
        };

        AppointmentBackUp.find({ psid: psid }, (err, result2) => {
          AppointmentBackUp.create(oldAppointment);
        });

        Appointment.updateOne(
          { psid: psid },
          { $pull: { appointment: { appointmentNumber: appointmentNumber } } },
          (err, result3) => {
            return res.json({
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text:
                        "Your appointment on " +
                        result[0].appointment[0].appointmentDate.toLocaleDateString(
                          undefined,
                          options
                        ) +
                        " has been cancelled.",
                      quick_replies: endreply,
                    },
                  },
                },
              ],
            });
          }
        );
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "rescheduleAppointment"
  ) {
    const appointmentNumber = req.body.queryResult.parameters.appointmentNumber;
    Appointment.findOne(
      { psid: psid },
      {
        appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
        psid: 1,
        fullName: 1,
        _id: 0,
      },
      (err, result) => {
        if (Object.keys(result).length > 0) {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text:
                      "Good day Mr/Ms. " +
                      result.fullName +
                      ". Your appointment on " +
                      result.appointment[0].appointmentDate.toLocaleDateString(
                        undefined,
                        options
                      ) +
                      " will be rescheduled. Do you want to schedule it within the same week of this appointment or the week after it?",
                    quick_replies: [
                      {
                        content_type: "text",
                        title: "Within The Same Week",
                        payload: "rescheduleThisWeek",
                      },
                      {
                        content_type: "text",
                        title: "Week After It",
                        payload: "rescheduleNextWeek",
                      },
                    ],
                  },
                },
              },
            ],
          });
        } else {
          return res.json({
            fulfillmentMessages: [
              {
                payload: {
                  facebook: {
                    text: "Sorry, but we can't find any appointment with the number you provided.",
                    quick_replies: endreply,
                  },
                },
              },
            ],
          });
        }
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "rescheduleThisWeek"
  ) {
    const appointmentNumber =
      req.body.queryResult.outputContexts[0].parameters.appointmentNumber;

    Appointment.findOne(
      { psid: psid },
      {
        appointment: { $elemMatch: { appointmentNumber: appointmentNumber } },
        psid: 1,
        fullName: 1,
        _id: 0,
      },
      (err, result) => {
        const date = new Date(result.appointment[0].appointmentDate);
        const day = date.getDay();
        const finalObj = {
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: "Please pick your preferred appointment day. ",
                  quick_replies: [],
                },
              },
            },
          ],
        };

        for (const [key, value] of Object.entries(objDate)) {
          if (day == 5) {
            return res.json({
              fulfillmentMessages: [
                {
                  payload: {
                    facebook: {
                      text: "Sorry, you're currently booked on Friday. We are closed during weekends. Instead, do you want to book the week after this current appointment?",
                      quick_replies: [
                        {
                          content_type: "text",
                          title: "Yes",
                          payload: "rescheduleNextWeek",
                        },
                        {
                          content_type: "text",
                          title: "No",
                          payload: "cancelIntent",
                        },
                      ],
                    },
                  },
                },
              ],
            });
          } else if (day < key) {
            const obj = {
              content_type: "text",
              title: value,
              payload: value,
            };
            finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
              obj
            );
          }
        }

        return res.json(finalObj);
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "rescheduleNextWeek"
  ) {
    const finalObj = {
      fulfillmentMessages: [
        {
          payload: {
            facebook: {
              text: "Please pick your preferred appointment day.",
              quick_replies: [],
            },
          },
        },
      ],
    };
    for (const [key, value] of Object.entries(dateObj)) {
      const obj = {
        content_type: "text",
        title: key,
        payload: key,
      };
      finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(obj);
    }
    return res.json(finalObj);
  } else if (
    req.body.queryResult.parameters.informationType == "doctorStatusPrompt"
  ) {
    Doctor.find({}, { doctorName: 1, _id: 0 }, (err, result) => {
      if (err) {
        console.log(err);
        return res.json({
          fulfillmentText: "Something went wrong.",
        });
      } else {
        const finalObj = {
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: "Which doctor would you like to check?",
                  quick_replies: [],
                },
              },
            },
          ],
        };
        for (let element of result) {
          const obj = {
            content_type: "text",
            title: element.doctorName,
            payload: element.doctorName,
          };
          finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
            obj
          );
        }
        return res.json(finalObj);
      }
    });
  } else if (
    req.body.queryResult.parameters.informationType == "doctorStatus"
  ) {
    const doctorName = req.body.queryResult.parameters.doctorName;

    Doctor.findOne({ doctorName: doctorName }, (err, result) => {
      if (Object.keys(result).length > 0) {
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text:
                    "Good day! Dr. " +
                    result.doctorName +
                    " is a professional licensed doctor and a specialist in the field of " +
                    result.doctorSpecialization +
                    ". Here's the doctor's schedule for this week:" +
                    "\n \n" +
                    "Monday: " +
                    result.doctorSchedule[0].isAvailable +
                    "\n" +
                    "Tuesday: " +
                    result.doctorSchedule[1].isAvailable +
                    "\n" +
                    "Wednesday: " +
                    result.doctorSchedule[2].isAvailable +
                    "\n" +
                    "Thursday: " +
                    result.doctorSchedule[3].isAvailable +
                    "\n" +
                    "Friday: " +
                    result.doctorSchedule[4].isAvailable,
                  quick_replies: endreply,
                },
              },
            },
          ],
        });
      } else {
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: "Sorry, we cannot find the doctor you are looking for.",
                  quick_replies: endreply,
                },
              },
            },
          ],
        });
      }
    });
  } else if (
    req.body.queryResult.parameters.informationType == "generalInformation"
  ) {
    Information.find({}, (err, result) => {
      if (err) {
        console.log(err);
        return res.json({
          fulfillmentText: "Something went wrong.",
        });
      } else {
        const finalObj = {
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: "What would you like to know?",
                  quick_replies: [],
                },
              },
            },
          ],
        };
        for (let element of result) {
          const obj = {
            content_type: "text",
            title: element.informationName,
            payload: element.informationName,
          };
          finalObj.fulfillmentMessages[0].payload.facebook.quick_replies.push(
            obj
          );
        }
        return res.json(finalObj);
      }
    });
  } else if (
    req.body.queryResult.parameters.informationType == "informationPrompt"
  ) {
    const informationName = req.body.queryResult.parameters.informationSelect;
    Information.find(
      { informationName: { $regex: informationName, $options: "i" } },
      (err, result) => {
        return res.json({
          fulfillmentMessages: [
            {
              payload: {
                facebook: {
                  text: result[0].description,
                  quick_replies: endreply,
                },
              },
            },
          ],
        });
      }
    );
  } else if (
    req.body.queryResult.parameters.informationType == "latestAnnouncements"
  ) {
    Announcement.aggregate([{ $sort: { createdAt: -1 } }], (err, result) => {
      return res.json({
        fulfillmentMessages: [
          {
            payload: {
              facebook: {
                text: "Latest Announcement:" + "\n \n" + result[0].message,
                quick_replies: endreply,
              },
            },
          },
        ],
      });
    });
  } else {
  }
};
