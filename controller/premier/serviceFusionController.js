const axios = require("axios");
const dayjs = require("dayjs");

getWaitingForPartsJobs = async (req, res) => {
  const accessToken = req.body.accessToken;
  const isTestMode = req.body.testMode === true;
  const baseUrl = "https://api.servicefusion.com/v1/jobs";
  const customerBaseUrl = "https://api.servicefusion.com/v1/customers";
  const limit = 50;
  let page = 1;
  let allJobs = [];

  if (!accessToken) {
    return res.status(400).json({
      status: "error",
      message: "Missing accessToken in request body.",
    });
  }

  try {
    if (isTestMode) {
      const testJobs = [
        {
          id: 2001,
          number: "JOB-008",
          customer_id: 88888801,
          customer_name: "PowerFlex Gym East",
          contact_first_name: "Amanda",
          contact_last_name: "Lopez",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Amanda Lopez",
          status: "4. Waiting For Parts",
          sub_status: "Confirmed",
          daysPending: 12,
          category: "emailOnly",
          is_requires_follow_up: true,
          products: "Precor Elliptical SN: 456789; Handle Wire",
          notes: "Parts ordered. No ETA provided.",
        },
        {
          id: 2002,
          number: "JOB-009",
          customer_id: 88888802,
          customer_name: "GoldLine Athletics",
          contact_first_name: "Ryan",
          contact_last_name: "Kim",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Ryan Kim",
          status: "4. Waiting For Parts",
          sub_status: "On Order",
          daysPending: 16,
          category: "emailAndCall",
          is_requires_follow_up: true,
          products: "Life Fitness Bike SN: 123321; Console",
          notes: "Console replacement on order. ETA TBD.",
        },
        {
          id: 2004,
          number: "JOB-011",
          customer_id: 88888804,
          customer_name: "PulsePoint Fitness",
          contact_first_name: "Ava",
          contact_last_name: "Morales",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Ava Morales",
          status: "4. Waiting For Parts",
          sub_status: "Backorder",
          daysPending: 47,
          category: "backorder",
          is_requires_follow_up: true,
          products: "Matrix Bike SN: 447788; Pedal Crank Arm",
          notes: "Backorder confirmed. ETA 6/26/2025.",
        },
        {
          id: 2005,
          number: "JOB-012",
          customer_id: 88888805,
          customer_name: "Titan Performance Club",
          contact_first_name: "Liam",
          contact_last_name: "Reyes",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Liam Reyes",
          status: "4. Waiting For Parts",
          sub_status: "Backorder",
          daysPending: 52,
          category: "backorder",
          is_requires_follow_up: true,
          products: "Precor Treadmill SN: 667788; Control Panel",
          notes: "Backorder confirmed. ETA 6/27/2025.",
        },
        {
          id: 2006,
          number: "JOB-013",
          customer_id: 88888806,
          customer_name: "Velocity Prime Gym",
          contact_first_name: "Isabella",
          contact_last_name: "Garcia",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Isabella Garcia",
          status: "4. Waiting For Parts",
          sub_status: "Backorder",
          daysPending: 61,
          category: "backorder",
          is_requires_follow_up: true,
          products: "Life Fitness Elliptical SN: 334455; Drive Belt",
          notes: "Backorder confirmed. ETA 6/28/2025.",
        },
        {
          id: 2004,
          number: "JOB-011",
          customer_id: 88888804,
          customer_name: "FitNation Elite",
          contact_first_name: "Derek",
          contact_last_name: "Ramirez",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Derek Ramirez",
          status: "4. Waiting For Parts",
          sub_status: "Delivered",
          daysPending: 67,
          category: "endOfLife",
          is_requires_follow_up: false,
          products: "Matrix Elliptical SN: 232323; Motor",
          notes: "Unit nearing 60+ days. Flag for replacement.",
        },
        {
          id: 2005,
          number: "JOB-012",
          customer_id: 88888805,
          customer_name: "FlexCore Downtown",
          contact_first_name: "Lana",
          contact_last_name: "Bennett",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Lana Bennett",
          status: "4. Waiting For Parts",
          sub_status: "In Transit",
          daysPending: 8,
          category: "emailOnly",
          is_requires_follow_up: false,
          products: "StarTrac Treadmill SN: 111222; Belt",
          notes: "Shipping confirmed. Arrival expected this week.",
        },
        {
          id: 2006,
          number: "JOB-013",
          customer_id: 88888806,
          customer_name: "The Resistance Lab",
          contact_first_name: "Marcus",
          contact_last_name: "Chang",
          contact_email: "gmaturan60@gmail.com",
          contact_phone: "(555) 123-1111",
          contact_name: "Marcus Chang",
          status: "4. Waiting For Parts",
          sub_status: "Awaiting Approval",
          daysPending: 38,
          category: "emailAndCall",
          is_requires_follow_up: true,
          products: "Torque Multistation SN: 787878; Upper Cable",
          notes: "Quote sent. Waiting for client approval.",
        },
      ];

      return res.json({
        status: "success",
        pagesFetched: 1,
        matched: testJobs.length,
        data: testJobs,
      });
    }

    console.log("🔁 Fetching jobs with status 'Waiting for Parts'...");

    while (true) {
      const encodedStatus = encodeURIComponent("4. Waiting For Parts");
      const fields = encodeURIComponent(
        [
          "id",
          "number",
          "customer_id",
          "customer_name",
          "contact_first_name",
          "contact_last_name",
          "status",
          "sub_status",
          "start_date",
          "updated_at",
          "note_to_customer",
          "tech_notes",
          "completion_notes",
          "is_requires_follow_up",
        ].join(",")
      );

      const expand = encodeURIComponent(
        "products,services,techs_assigned,notes"
      );

      const url =
        `${baseUrl}?filters[status]=${encodedStatus}` +
        `&page=${page}&per-page=${limit}` +
        `&fields=${fields}&expand=${expand}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      const jobs = response.data.items || [];
      if (jobs.length === 0) break;
      allJobs.push(...jobs);
      page++;
      if (jobs.length < limit) break;
    }

    const enrichJobWithCustomerContact = async (job) => {
      try {
        const customerUrl =
          `${customerBaseUrl}/${job.customer_id}` +
          `?expand=contacts.phones,contacts.emails`;
        const resp = await axios.get(customerUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
        const contacts = resp.data.contacts || [];
        const primary = contacts.find((c) => c.is_primary) || contacts[0] || {};
        const email = primary.emails?.[0]?.email || null;
        const phone = primary.phones?.[0]?.phone || null;
        const name =
          `${primary.fname || ""} ${primary.lname || ""}`.trim() || null;

        return {
          ...job,
          contact_email: email,
          contact_phone: phone,
          contact_name: name,
        };
      } catch {
        return {
          ...job,
          contact_email: null,
          contact_phone: null,
          contact_name: null,
        };
      }
    };

    const today = new Date();
    const categorizedJobs = {
      backorder: [],
      emailOnly: [],
      emailAndCall: [],
      endOfLife: [],
    };

    const enrichedJobs = await Promise.all(
      allJobs.map(async (job) => {
        const enriched = await enrichJobWithCustomerContact(job);

        const startDate = job.start_date || job.updated_at;
        enriched.daysPending = Math.floor(
          Math.abs(today - new Date(startDate)) / (1000 * 60 * 60 * 24)
        );

        enriched.notes =
          (job.notes || [])
            .map((n) => n.notes?.trim())
            .filter((txt) => txt)
            .join("\n\n") || null;

        enriched.assigned_techs =
          (job.techs_assigned || [])
            .map((t) => `${t.first_name} ${t.last_name}`.trim())
            .filter((n) => n)
            .join(", ") || null;

        // ✅ Replace product names with product descriptions
        enriched.products =
          (job.products || [])
            .map((p) => p.description)
            .filter(Boolean)
            .join(", ") || null;

        enriched.services =
          (job.services || []).map((s) => s.name).join(", ") || null;

        const sub = job.sub_status?.toLowerCase() || "";
        if (sub.includes("backorder") || sub.includes("back ordered")) {
          enriched.category = "backorder";
          categorizedJobs.backorder.push(enriched);
        } else if (enriched.daysPending < 14) {
          enriched.category = "emailOnly";
          categorizedJobs.emailOnly.push(enriched);
        } else if (enriched.daysPending < 60) {
          enriched.category = "emailAndCall";
          categorizedJobs.emailAndCall.push(enriched);
        } else {
          enriched.category = "endOfLife";
          categorizedJobs.endOfLife.push(enriched);
        }

        return enriched;
      })
    );

    res.json({
      status: "success",
      pagesFetched: page,
      matched: enrichedJobs.length,
      data: [
        ...categorizedJobs.backorder,
        ...categorizedJobs.emailOnly,
        ...categorizedJobs.emailAndCall,
        ...categorizedJobs.endOfLife,
      ],
    });
  } catch (error) {
    console.error("❌ Error fetching jobs:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch or enrich jobs.",
      details: error.message,
    });
  }
};

const getJobsByStatusName = async (req, res) => {
  const accessToken = process.env.SF_TOKEN;
  const baseUrl = "https://api.servicefusion.com/v1";
  const limit = 50;
  const targetStatusName = "Waiting for Parts";

  try {
    // Step 1: Get status ID for "Waiting for Parts"
    const statusResponse = await axios.get(
      `${baseUrl}/job-statuses?per-page=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const statuses = statusResponse.data.items || [];
    const matchingStatus = statuses.find((status) =>
      status.name.toLowerCase().includes(targetStatusName.toLowerCase())
    );

    if (!matchingStatus) {
      return res.status(404).json({
        status: "error",
        message: `Status '${targetStatusName}' not found in job-statuses.`,
      });
    }

    const jobStatusId = matchingStatus.id;
    console.log(`🔍 Found status ID ${jobStatusId} for '${targetStatusName}'`);

    const allJobs = [];
    let currentPage = 1;
    const batchSize = 10;
    let keepGoing = true;

    const fetchPage = async (page) => {
      const url = `${baseUrl}/jobs?job_status_id=${jobStatusId}&page=${page}&per-page=${limit}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });
      return response.data.items || [];
    };

    while (keepGoing) {
      const pageBatch = Array.from(
        { length: batchSize },
        (_, i) => currentPage + i
      );
      console.log(`🚀 Fetching pages: ${pageBatch.join(", ")}`);

      const batchResults = await Promise.allSettled(pageBatch.map(fetchPage));

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i];
        const pageNumber = currentPage + i;

        if (result.status === "fulfilled") {
          const jobs = result.value;
          console.log(`📦 Page ${pageNumber}: Retrieved ${jobs.length} jobs`);

          if (jobs.length === 0) {
            keepGoing = false;
            break;
          }

          allJobs.push(...jobs);

          // Stop if fewer jobs than limit
          if (jobs.length < limit) {
            keepGoing = false;
            break;
          }
        } else {
          console.error(
            `❌ Failed to fetch page ${pageNumber}: ${result.reason.message}`
          );
          keepGoing = false;
          break;
        }
      }

      currentPage += batchSize;
    }

    console.log(
      `✅ Total jobs with status '${targetStatusName}': ${allJobs.length}`
    );

    res.json({
      status: "success",
      matched: allJobs.length,
      statusId: jobStatusId,
      data: allJobs,
    });
  } catch (error) {
    console.error("❌ Error fetching jobs by status:", error.message);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch jobs by status.",
      details: error.message,
    });
  }
};

function getDueDate(invoice) {
  const issueDate = dayjs(invoice.date);
  const termsRaw = invoice.terms?.toLowerCase().trim() || "net30";
  const match = termsRaw.match(/net\s*(\d+)/);

  if (match) return issueDate.add(parseInt(match[1], 10), "day");
  if (termsRaw.includes("cod") || termsRaw.includes("receipt"))
    return issueDate;

  return issueDate.add(30, "day"); // Default fallback
}

const testInvoices = [
  // actual COD invoice (0-30)
  {
    id: 1027750884,
    number: 98042,
    currency: "$",
    terms: "COD",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=ICsLOGrNNc72-SZZTwwpbZYZLDfssw7NsHrCB9WMbDM&key=3SjGgktEKXmmYKYfy-zX9BK_D4YvxwJcJK902E606ZY",
    total: 175,
    is_paid: false,
    date: "2025-04-03T00:00:00+00:00",
    customer: "The Handlery",
    customer_contact: "Jessica Valdez",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },

  // NET30 invoices (0-30)
  {
    id: 1026982560,
    number: 97429,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=1M4aMDFlMRSnKQklcaIi52VinJgnQCwbgZelybAdHkY&key=2I1t43MEH8iwuXww4hf4iKsxT7tAhCrJIMu8dZ7jsFo",
    total: 125,
    is_paid: false,
    date: "2025-04-03T00:00:00+00:00",
    customer: "Aloft San Antonio Airport",
    customer_contact: "Michael Thompson",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },
  {
    id: 1026982563,
    number: 97430,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=DgppckfU48jHjGTYOdla98DYb96WHx7xxLJe5jXJMIo&key=ArSavArtCyv8GSaZVkrjd0ns8oXv32ZAyRq5K5hGJ2c",
    total: 196.88,
    is_paid: false,
    date: "2025-04-03T00:00:00+00:00",
    customer: "Northrop 160",
    customer_contact: "Sarah Nguyen",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },
  {
    id: 1026982565,
    number: 97431,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=wFa9KlmPAEFM1vF5zvFh8SgNa6_or0gvuU-RKwA0fWo&key=83_0992TbLL1RV3GmFrulFLgXW1Vso20CP89cG8f4i4",
    total: 140,
    is_paid: false,
    date: "2025-04-03T00:00:00+00:00",
    customer: "Harbor Village Apts",
    customer_contact: "David Ramirez",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },

  // 31–60 days past due
  {
    id: 1027750885,
    number: 98043,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=fdwKIBnS_ct1RZWYP-e1lpTTr439-GWPS4JpCqD7Zbc&key=c9eX8ZQ2dMDw8Cqqu9zP_Tun49iCPRC7OIq6M8FVNfU",
    total: 300,
    is_paid: false,
    date: "2025-04-03T00:00:00+00:00", // dueDate ~2025-05-03 → ~45 days past due on 2025-06-17
    customer: "Mid Term LLC",
    customer_contact: "Emily Carter",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },

  // 61–90 days past due
  {
    id: 1027750886,
    number: 98044,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=AuwAlsGWClJ3HytVPaU-6JNmIWt90Qqi5WTojG2xgQk&key=S3lnre9qrTQ1Dl_HC9OlPwFkuX-arTbzuEHuwtiI3T0",
    total: 400,
    is_paid: false,
    date: "2025-03-04T00:00:00+00:00", // dueDate ~2025-04-03 → ~75 days past due
    customer: "Longer Term Corp.",
    customer_contact: "Christopher Lee",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },

  // 91+ days past due
  {
    id: 1027750887,
    number: 98045,
    currency: "$",
    terms: "NET30",
    payment_terms: null,
    pay_online_url:
      "https://app.servicefusion.com/invoiceOnline?id=rTacaJvYjR9hkmCRiksFw_we5i6UFxfNefhXAnPBXEc&key=v3JkHTBN4xsnYbjkUonrk-4EefMwjYIwq7Y8cCHFUFw",
    total: 500,
    is_paid: false,
    date: "2025-02-15T00:00:00+00:00", // dueDate ~2025-03-17 → ~92 days past due
    customer: "Very Long Term LLC",
    customer_contact: "Lee valdex",
    bill_to_email_id: "gmaturan60@gmail.com",
    bill_to_phone_id: "(619) 298-0511",
  },
];

const getinvoice = async (req, res) => {
  const startTime = Date.now();
  const { accessToken, testMode } = req.body;
  console.log("getInvoice called", { testMode });

  if (!accessToken) {
    console.error("Missing access token");
    return res.status(400).json({ error: "Missing access token" });
  }

  const bucketCategory = (daysPast) => {
    if (daysPast <= 30) return "0-30_days";
    if (daysPast <= 60) return "31-60_days";
    if (daysPast <= 90) return "61-90_days";
    return "91+_days";
  };

  const parseTerms = (termsStr) =>
    parseInt((termsStr || "").replace(/\D/g, ""), 10) || 0;

  const enrich = (invoices) => {
    const today = dayjs();
    return invoices
      .filter((inv) => !inv.is_paid)
      .map((inv) => {
        const rawTerms = inv.terms ?? inv.payment_terms;
        const termDays = parseTerms(rawTerms);
        const dueDate = dayjs(inv.date).add(termDays, "day");
        const daysPastDue = today.diff(dueDate, "day");
        return {
          ...inv,
          dueDate: dueDate.format("YYYY-MM-DD"),
          daysPastDue,
          category: bucketCategory(daysPastDue),
        };
      })
      .filter((inv) => inv.daysPastDue > 0);
  };

  if (testMode) {
    console.log("Running in test mode");
    const enriched = enrich(testInvoices);
    const totalAmount = enriched.reduce((sum, i) => sum + Number(i.total), 0);
    const categoryCounts = enriched.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});
    const count = enriched.length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("Test mode results", { count, totalAmount, categoryCounts });
    console.log(`getInvoice completed in ${duration}s`);
    return res.status(200).json({
      success: true,
      count,
      totalAmount,
      categoryCounts,
      data: enriched,
      duration: `${duration}s`,
    });
  }

  console.log("Running in production mode");
  const today = dayjs();
  const weekday = today.day();
  console.log("Today is weekday number", weekday);

  let allowedCategories = [];
  if ([2, 4, 5].includes(weekday)) {
    allowedCategories = ["31-60_days"];
  } else if ([1, 3].includes(weekday)) {
    allowedCategories = ["61-90_days", "91+_days"];
  } else {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("Weekend—nothing to process");
    console.log(`getInvoice completed in ${duration}s`);
    return res.status(200).json({
      success: true,
      count: 0,
      totalAmount: 0,
      categoryCounts: {},
      data: [],
      duration: `${duration}s`,
    });
  }

  console.log("Allowed categories for processing:", allowedCategories);

  const enrichAndFilter = (invoices) =>
    enrich(invoices).filter((inv) => allowedCategories.includes(inv.category));

  const BASE_URL = "https://api.servicefusion.com/v1/invoices";
  const PER_PAGE = 50;
  const FIELDS = [
    "id",
    "number",
    "date",
    "total",
    "is_paid",
    "currency",
    "customer",
    "customer_contact",
    "bill_to_email_id",
    "bill_to_phone_id",
    "terms",
    "payment_terms",
    "pay_online_url",
  ].join(",");

  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 2 * 60 * 1000,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  try {
    console.log("Fetching first page of invoices");
    const first = await client.get("", {
      params: {
        "filter[is_paid]": false,
        "per-page": PER_PAGE,
        page: 1,
        sort: "-date",
        fields: FIELDS,
      },
    });
    const allItems = [...(first.data.items || [])];
    const pageCount = Number(
      first.headers["x-pagination-page-count"] ||
        first.data._meta?.pageCount ||
        1
    );
    console.log(
      `Page 1 fetched: ${allItems.length} items; total pages: ${pageCount}`
    );

    if (pageCount > 1) {
      console.log("Fetching remaining pages");
      const pages = await Promise.all(
        Array.from({ length: pageCount - 1 }, (_, i) =>
          client.get("", {
            params: {
              "filter[is_paid]": false,
              "per-page": PER_PAGE,
              page: i + 2,
              sort: "-date",
              fields: FIELDS,
            },
          })
        )
      );
      pages.forEach((r) => allItems.push(...(r.data.items || [])));
      console.log(`All pages fetched: ${allItems.length} total items`);
    }

    const enriched = enrichAndFilter(allItems);
    const totalAmount = enriched.reduce((sum, i) => sum + Number(i.total), 0);
    const categoryCounts = enriched.reduce((acc, i) => {
      acc[i.category] = (acc[i.category] || 0) + 1;
      return acc;
    }, {});
    const count = enriched.length;

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log("Final results", { count, totalAmount, categoryCounts });
    console.log(`getInvoice completed in ${duration}s`);
    return res.status(200).json({
      success: true,
      count,
      totalAmount,
      categoryCounts,
      data: enriched,
      duration: `${duration}s`,
    });
  } catch (err) {
    console.error("Error fetching unpaid invoices:", err.message);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`getInvoice failed after ${duration}s`);
    return res.status(500).json({
      error: "Failed to fetch unpaid invoices",
      details: err.message,
      duration: `${duration}s`,
    });
  }
};

module.exports = {
  getWaitingForPartsJobs,
  getJobsByStatusName,
  getinvoice,
};
