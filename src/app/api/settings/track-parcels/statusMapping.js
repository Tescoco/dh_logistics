const statusMapping = [
  {
    status_id: "1",
    status_name: "Record Created",
    internal_status: "record_created",
  },
  {
    status_id: "2",
    status_name: "Departed From Origin",
    internal_status: "in_transit",
  },
  {
    status_id: "4",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "5",
    status_name: "Attempted Cancelled",
    internal_status: "attempted_cancel",
  },
  {
    status_id: "6",
    status_name: "No Answer",
    internal_status: "no_answer",
  },
  {
    status_id: "8",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "9",
    status_name: "Canceled",
    internal_status: "cancelled",
  },
  {
    status_id: "10",
    status_name: "Customer Canceled",
    internal_status: "cancelled",
  },
  {
    status_id: "11",
    status_name: "Out For Delivery",
    internal_status: "out_for_delivery",
  },
  {
    status_id: "12",
    status_name: "Number Switched Off",
    internal_status: "number_switched_off",
  },
  {
    status_id: "13",
    status_name: "Returned",
    internal_status: "returned",
  },
  {
    status_id: "15",
    status_name: "Reforwarded",
    internal_status: "in_transit",
  },
  {
    status_id: "16",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "18",
    status_name: "Forward to Final Destination",
    internal_status: "in_transit",
  },
  {
    status_id: "19",
    status_name: "SMS Sent to Consignee",
    internal_status: "in_transit",
  },
  {
    status_id: "20",
    status_name: "Held For Consignee Pickup",
    internal_status: "in_transit",
  },
  {
    status_id: "21",
    status_name: "Shipment on Hold",
    internal_status: "shipment_on_hold",
  },
  {
    status_id: "22",
    status_name: "Returned Shipment",
    internal_status: "returned",
  },
  {
    status_id: "23",
    status_name: "Reforwarded",
    internal_status: "in_transit",
  },
  {
    status_id: "24",
    status_name: "Product Destroyed",
    internal_status: "lost_damaged",
  },
  {
    status_id: "25",
    status_name: "Return to Warehouse",
    internal_status: "returned",
  },
  {
    status_id: "26",
    status_name: "Return to Shipper",
    internal_status: "returned",
  },
  {
    status_id: "27",
    status_name: "Held in Customs",
    internal_status: "in_transit",
  },
  {
    status_id: "28",
    status_name: "Return to Agent",
    internal_status: "returned",
  },
  {
    status_id: "29",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "30",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "31",
    status_name: "Shipment Under Process",
    internal_status: "in_transit",
  },
  {
    status_id: "32",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "33",
    status_name: "Prepared For Return",
    internal_status: "returning",
  },
  {
    status_id: "34",
    status_name: "Reforwarded UAE",
    internal_status: "in_transit",
  },
  {
    status_id: "35",
    status_name: "Reforwarded Qatar",
    internal_status: "in_transit",
  },
  {
    status_id: "36",
    status_name: "Shipment Lost",
    internal_status: "lost_damaged",
  },
  {
    status_id: "37",
    status_name: "Custom Clearance in Process KSA",
    internal_status: "in_transit",
  },
  {
    status_id: "38",
    status_name: "Custom Clearance in Process QATAR",
    internal_status: "in_transit",
  },
  {
    status_id: "39",
    status_name: "Custom Clearance in Process UAE",
    internal_status: "in_transit",
  },
  {
    status_id: "40",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "41",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "42",
    status_name: "Parcel Already Reforwarded",
    internal_status: "in_transit",
  },
  {
    status_id: "43",
    status_name: "Preparing for Return",
    internal_status: "returned",
  },
  {
    status_id: "44",
    status_name: "Returning to Pakistan\r\n",
    internal_status: "returning",
  },
  {
    status_id: "45",
    status_name: "Returned to Client",
    internal_status: "returned",
  },
  {
    status_id: "46",
    status_name: "Arrived Riyadh Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "47",
    status_name: "Arrived Jeddah Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "48",
    status_name: "Arrived Dammam Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "49",
    status_name: "Arrived Doha Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "50",
    status_name: "Arrived Dubai Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "51",
    status_name: "Shipment Under Console",
    internal_status: "in_transit",
  },
  {
    status_id: "52",
    status_name: "Custom Clearance in Process Karachi",
    internal_status: "in_transit",
  },
  {
    status_id: "53",
    status_name: "Returned to Karachi",
    internal_status: "returned",
  },
  {
    status_id: "54",
    status_name: "Shipment Under Process Lahore",
    internal_status: "in_transit",
  },
  {
    status_id: "55",
    status_name: "In Transit To Karachi",
    internal_status: "in_transit",
  },
  {
    status_id: "56",
    status_name: "Amount Refunded to Customer",
    internal_status: "in_transit",
  },
  {
    status_id: "57",
    status_name: "Shipment Returned Marked by Client",
    internal_status: "returned",
  },
  {
    status_id: "58",
    status_name: "Shipment Destroyed Marked by Client",
    internal_status: "lost_damaged",
  },
  {
    status_id: "59",
    status_name: "Arrived Abudhabi Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "60",
    status_name: "Reforwarded KSA",
    internal_status: "in_transit",
  },
  {
    status_id: "61",
    status_name: "Arrived Madinah Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "62",
    status_name: "Arrived KSA Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "63",
    status_name: "Arrived UAE Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "64",
    status_name: "Arrived Makkah Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "65",
    status_name: "Departed From Dubai Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "66",
    status_name: "Arrived Bahrain Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "67",
    status_name: "Delivered",
    internal_status: "delivered",
  },
  {
    status_id: "68",
    status_name: "Custom Clearance in Process",
    internal_status: "in_transit",
  },
  {
    status_id: "69",
    status_name: "Cleared From Customs",
    internal_status: "in_transit",
  },
  {
    status_id: "70",
    status_name: "Dropped at Origin Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "71",
    status_name: "Arrived Kuwait Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "72",
    status_name: "Invalid Record Created",
    internal_status: "in_transit",
  },
  {
    status_id: "73",
    status_name: "Arrived Oman Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "74",
    status_name: "Delivered Express",
    internal_status: "delivered",
  },
  {
    status_id: "75",
    status_name: "Arrived Jordan Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "76",
    status_name: "Arrived Jubail Facility ",
    internal_status: "in_transit",
  },
  {
    status_id: "77",
    status_name: "Arrived Taif Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "78",
    status_name: "Arrived Hofuf facility",
    internal_status: "in_transit",
  },
  {
    status_id: "79",
    status_name: "Arrived Jizan Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "80",
    status_name: "Arrived Yanbu Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "81",
    status_name: "Arrived Abha Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "82",
    status_name: "Under Processing At Lahore Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "83",
    status_name: "Shipment Returned Marked By RGS",
    internal_status: "returned",
  },
  {
    status_id: "84",
    status_name: "Returned To Dubai",
    internal_status: "returned",
  },
  {
    status_id: "85",
    status_name: "Returning to Dubai",
    internal_status: "returning",
  },
  {
    status_id: "86",
    status_name: "Returned To Bahrain",
    internal_status: "returned",
  },
  {
    status_id: "87",
    status_name: "Returning To Bahrain",
    internal_status: "returning",
  },
  {
    status_id: "89",
    status_name: "Shipment Under Process Dubai",
    internal_status: "in_transit",
  },
  {
    status_id: "90",
    status_name: "Shipment Under Console Dubai",
    internal_status: "in_transit",
  },
  {
    status_id: "91",
    status_name: "Shipment on Hold - RGS",
    internal_status: "shipment_on_hold",
  },
  {
    status_id: "92",
    status_name: "Shipment on Hold - Shipper",
    internal_status: "shipment_on_hold",
  },
  {
    status_id: "93",
    status_name: "Returned to Inventory",
    internal_status: "returned",
  },
  {
    status_id: "94",
    status_name: "Shipment Weight Updated",
    internal_status: "in_transit",
  },
  {
    status_id: "95",
    status_name: "Return To Riyadh Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "96",
    status_name: "Pending Return To Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "97",
    status_name: "Return in Process",
    internal_status: "returning",
  },
  {
    status_id: "98",
    status_name: "Return Lost in Transit",
    internal_status: "returning",
  },
  {
    status_id: "99",
    status_name: "Returning to Riyadh Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "100",
    status_name: "Shipment Packed",
    internal_status: "in_transit",
  },
  {
    status_id: "101",
    status_name: "RTW & Moved With New Booking",
    internal_status: "in_transit",
  },
  {
    status_id: "102",
    status_name: "Returning to Jeddah",
    internal_status: "returning",
  },
  {
    status_id: "103",
    status_name: "Returning to Dammam",
    internal_status: "returning",
  },
  {
    status_id: "104",
    status_name: "Returning to Makkah",
    internal_status: "returning",
  },
  {
    status_id: "105",
    status_name: "Returning to Madina",
    internal_status: "returning",
  },
  {
    status_id: "106",
    status_name: "Partial Amount Refunded To Customer",
    internal_status: "in_transit",
  },
  {
    status_id: "107",
    status_name: "Arrived Tabuk Facility",
    internal_status: "in_transit",
  },
  {
    status_id: "108",
    status_name: "Pending",
    internal_status: "pending",
  },
  {
    status_id: "109",
    status_name: "Shipment on Hold - Warehouse",
    internal_status: "shipment_on_hold",
  },
  {
    status_id: "110",
    status_name: "Out of range",
    internal_status: "in_transit",
  },
  {
    status_id: "111",
    status_name: "Out Of Range -In Warehouse",
    internal_status: "in_transit",
  },
  {
    status_id: "112",
    status_name: "P.R Oman",
    internal_status: "in_transit",
  },
  {
    status_id: "113",
    status_name: "Parcel Damage In Transit",
    internal_status: "lost_damaged",
  },
  {
    status_id: "114",
    status_name: "Return Damage In Transit",
  },
  {
    status_id: "115",
    status_name: "Un Delivered",
    internal_status: "in_transit",
  },
  {
    status_id: "116",
    status_name: "Returning to Warehouse (Non-COD)",
    internal_status: "returning",
  },
  {
    status_id: "117",
    status_name: "Return To Riyadh Warehouse(Non-COD)",
    internal_status: "returning",
  },
  {
    status_id: "118",
    status_name: "Return To Jeddah Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "119",
    status_name: "Return to Warehouse (Non-COD)",
    internal_status: "returning",
  },
  {
    status_id: "120",
    status_name: "Arrived Riyadh Warehouse",
    internal_status: "in_transit",
  },
  {
    status_id: "121",
    status_name: "Arrived Jeddah Warehouse",
    internal_status: "in_transit",
  },
  {
    status_id: "122",
    status_name: "Return to Abha Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "123",
    status_name: "Return to Dammam Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "124",
    status_name: "Return to Hofuf Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "125",
    status_name: "Return to Jizan Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "126",
    status_name: "Return to Madinah Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "127",
    status_name: "Return to Makkah Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "128",
    status_name: "Return to Tabuk Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "129",
    status_name: "Return to Taif Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "130",
    status_name: "Lost Shipment Compensated",
    internal_status: "lost_damaged",
  },
  {
    status_id: "134",
    status_name: "Shipment Under Process Riyadh",
    internal_status: "in_transit",
  },
  {
    status_id: "135",
    status_name: "Shipment Under Process Jeddah",
    internal_status: "in_transit",
  },
  {
    status_id: "136",
    status_name: "Shipment Under Process UAE",
    internal_status: "in_transit",
  },
  {
    status_id: "137",
    status_name: "Shipment Under Console Riyadh",
    internal_status: "in_transit",
  },
  {
    status_id: "138",
    status_name: "Shipment Under Console Jeddah",
    internal_status: "in_transit",
  },
  {
    status_id: "139",
    status_name: "Shipment Under Console Tabuk",
    internal_status: "in_transit",
  },
  {
    status_id: "140",
    status_name: "Shipment Under Console Dammam",
    internal_status: "in_transit",
  },
  {
    status_id: "141",
    status_name: "Shipment Under Console Madinah",
    internal_status: "in_transit",
  },
  {
    status_id: "142",
    status_name: "Shipment Under Console Makkah",
    internal_status: "in_transit",
  },
  {
    status_id: "143",
    status_name: "Shipment Under Console Abha",
    internal_status: "in_transit",
  },
  {
    status_id: "144",
    status_name: "Shipment Under Console Jubail",
    internal_status: "in_transit",
  },
  {
    status_id: "145",
    status_name: "Shipment Under Console Hofuf",
    internal_status: "in_transit",
  },
  {
    status_id: "146",
    status_name: "Shipment Under Console Jizan",
    internal_status: "in_transit",
  },
  {
    status_id: "147",
    status_name: "Shipment Under Console Taif",
    internal_status: "in_transit",
  },
  {
    status_id: "148",
    status_name: "Payment Received UAE",
    internal_status: "in_transit",
  },
  {
    status_id: "149",
    status_name: "Moved via 3PL",
    internal_status: "in_transit",
  },
  {
    status_id: "150",
    status_name: "Out of Stock",
    internal_status: "in_transit",
  },
  {
    status_id: "151",
    status_name: "Returning to Origin (Approval)\r\n",
    internal_status: "returning",
  },
  {
    status_id: "153",
    status_name: "Return to Bahrain Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "155",
    status_name: "Reforwarded BAHRAIN",
    internal_status: "in_transit",
  },
  {
    status_id: "156",
    status_name: "Reforwarded OMAN",
    internal_status: "in_transit",
  },
  {
    status_id: "157",
    status_name: "Reforwarded KUWAIT",
    internal_status: "in_transit",
  },
  {
    status_id: "158",
    status_name: "Shipment Picked Up",
    internal_status: "in_transit",
  },
  {
    status_id: "159",
    status_name: "Returning to Client",
    internal_status: "returning",
  },
  {
    status_id: "160",
    status_name: "Dispatched on hold",
    internal_status: "in_transit",
  },
  {
    status_id: "161",
    status_name: "Delivery Confirmed By Customer",
    internal_status: "in_transit",
  },
  {
    status_id: "162",
    status_name: "Confirmed With Delivery Location",
    internal_status: "in_transit",
  },
  {
    status_id: "163",
    status_name: "Delivery Confirmation Msg Sent",
    internal_status: "in_transit",
  },
  {
    status_id: "164",
    status_name: "Delivery Confirmation Reminder Sent",
    internal_status: "in_transit",
  },
  {
    status_id: "165",
    status_name: "Shipment Return To Facility",
    internal_status: "returning",
  },
  {
    status_id: "166",
    status_name: "Return to Kuwait Warehouse",
    internal_status: "returning",
  },
  {
    status_id: "167",
    status_name: "Return to Dubai Warehouse",
    internal_status: "returning",
  },
];

export default statusMapping;
