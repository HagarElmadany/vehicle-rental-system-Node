const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Translation object
const translations = {
  en: {
    title: "CAR RENTAL AGREEMENT",
    agreementNumber: "Agreement Number",
    date: "Date",
    customerInfo: "CUSTOMER INFORMATION",
    name: "Name",
    email: "Email",
    phone: "Phone",
    pickupLocation: "Pickup Location",
    dropoffLocation: "Drop-off Location",
    vehicleDetails: "VEHICLE DETAILS",
    brand: "Brand",
    model: "Model",
    year: "Year",
    licensePlate: "License Plate",
    transmission: "Transmission",
    fuelType: "Fuel Type",
    seats: "Seats",
    color: "Color",
    rentalPeriod: "RENTAL PERIOD",
    startDate: "Start Date",
    endDate: "End Date",
    withDriver: "With Driver",
    pricingBreakdown: "PRICING BREAKDOWN",
    dailyRate: "Daily Rate",
    hourlyRate: "Hourly Rate",
    depositRequired: "Deposit Required",
    totalCost: "Total Cost",
    insurance: "Insurance",
    egp: "EGP",
    yes: "Yes",
    no: "No",
    termsConditions: "TERMS AND CONDITIONS",
    terms: [
      "1. FUEL POLICY: Vehicle must be returned with the same fuel level as at pickup.",
      "2. MILEAGE: Unlimited mileage included unless otherwise specified.",
      "3. LATE RETURN: Additional charges apply for late returns (50 EGP per hour).",
      "4. DAMAGE: Customer is responsible for any damage to the vehicle during rental period.",
      "5. INSURANCE: Customer acknowledges insurance coverage as specified above.",
      "6. CANCELLATION: Cancellation fees apply as per company policy.",
      "7. LIABILITY: Customer assumes full responsibility for traffic violations and fines.",
      "8. RETURN CONDITION: Vehicle must be returned in same condition as received.",
    ],
    privacyPolicy: "PRIVACY POLICY & CONSENT",
    privacyText:
      "By signing this agreement, you consent to the collection and processing of your personal data for rental purposes in accordance with our privacy policy. Your data will be used solely for this rental transaction and may be shared with necessary third parties (insurance, law enforcement) as required.",
    liabilityWaiver: "LIABILITY WAIVER",
    liabilityText:
      "Customer acknowledges that rental of this vehicle is at their own risk. Customer releases the rental company from liability for any damages, injuries, or losses that may occur during the rental period, except in cases of gross negligence by the rental company.",
    digitalSignature: "DIGITAL SIGNATURE",
    customerSignature: "Customer Signature:",
    signedOn: "Signed on:",
    signatureRequired: "Signature Required:",
    agreementAcceptance:
      "By signing above, I acknowledge that I have read, understood, and agree to all terms and conditions of this rental agreement. I confirm that all information provided is accurate and complete.",
    footer:
      "This is a legally binding agreement. Keep a copy for your records.",
    signatureError: "[Signature image could not be rendered]",
  },
  ar: {
    title: "عقد إيجار سيارة",
    agreementNumber: "رقم العقد",
    date: "التاريخ",
    customerInfo: "معلومات العميل",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    pickupLocation: "مكان الاستلام",
    dropoffLocation: "مكان التسليم",
    vehicleDetails: "تفاصيل المركبة",
    brand: "الماركة",
    model: "الموديل",
    year: "السنة",
    licensePlate: "رقم اللوحة",
    transmission: "ناقل الحركة",
    fuelType: "نوع الوقود",
    seats: "عدد المقاعد",
    color: "اللون",
    rentalPeriod: "فترة الإيجار",
    startDate: "تاريخ البداية",
    endDate: "تاريخ النهاية",
    withDriver: "مع سائق",
    pricingBreakdown: "تفصيل الأسعار",
    dailyRate: "السعر اليومي",
    hourlyRate: "السعر بالساعة",
    depositRequired: "الوديعة المطلوبة",
    totalCost: "التكلفة الإجمالية",
    insurance: "التأمين",
    egp: "جنيه مصري",
    yes: "نعم",
    no: "لا",
    termsConditions: "الشروط والأحكام",
    terms: [
      "١. سياسة الوقود: يجب إرجاع المركبة بنفس مستوى الوقود عند الاستلام.",
      "٢. المسافة: المسافة غير محدودة ما لم يُنص على خلاف ذلك.",
      "٣. التأخير في الإرجاع: رسوم إضافية تطبق للإرجاع المتأخر (٥٠ جنيه مصري في الساعة).",
      "٤. الأضرار: العميل مسؤول عن أي ضرر يلحق بالمركبة خلال فترة الإيجار.",
      "٥. التأمين: العميل يقر بتغطية التأمين كما هو محدد أعلاه.",
      "٦. الإلغاء: رسوم الإلغاء تطبق حسب سياسة الشركة.",
      "٧. المسؤولية: العميل يتحمل المسؤولية الكاملة عن مخالفات المرور والغرامات.",
      "٨. حالة الإرجاع: يجب إرجاع المركبة بنفس الحالة التي تم استلامها بها.",
    ],
    privacyPolicy: "سياسة الخصوصية والموافقة",
    privacyText:
      "بتوقيع هذا العقد، أنت توافق على جمع ومعالجة بياناتك الشخصية لأغراض الإيجار وفقاً لسياسة الخصوصية الخاصة بنا. ستُستخدم بياناتك فقط لهذه المعاملة الإيجارية وقد تُشارك مع الأطراف الثالثة الضرورية (التأمين، إنفاذ القانون) حسب الحاجة.",
    liabilityWaiver: "إخلاء المسؤولية",
    liabilityText:
      "العميل يقر بأن إيجار هذه المركبة على مسؤوليته الخاصة. العميل يعفي شركة التأجير من المسؤولية عن أي أضرار أو إصابات أو خسائر قد تحدث خلال فترة الإيجار، إلا في حالات الإهمال الجسيم من قبل شركة التأجير.",
    digitalSignature: "التوقيع الرقمي",
    customerSignature: "توقيع العميل:",
    signedOn: "تم التوقيع في:",
    signatureRequired: "التوقيع مطلوب:",
    agreementAcceptance:
      "بالتوقيع أعلاه، أقر بأنني قرأت وفهمت ووافقت على جميع الشروط والأحكام لعقد الإيجار هذا. أؤكد أن جميع المعلومات المقدمة دقيقة وكاملة.",
    footer: "هذا عقد ملزم قانونياً. احتفظ بنسخة لسجلاتك.",
    signatureError: "[لا يمكن عرض صورة التوقيع]",
  },
};

exports.generateRentalAgreementPDF = async (
  bookingData,
  signatureData = null,
  language = "en"
) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("🌐 Generating PDF in language:", language);

      // Create PDF document with proper font handling
      const doc = new PDFDocument({
        margin: 50,
        bufferPages: true,
      });

      const filename = `rental-agreement-${bookingData._id}-${language}.pdf`;
      const filepath = path.join(
        __dirname,
        "..",
        "uploads",
        "agreements",
        filename
      );

      // Ensure directory exists
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      const t = translations[language] || translations.en;
      const isArabic = language === "ar";

      // Set up fonts - for Arabic we'll use a Unicode font that supports Arabic
      if (isArabic) {
        try {
          // Try to register an Arabic font if available
          doc.registerFont(
            "Arabic",
            path.join(__dirname, "../fonts/NotoSansArabic.ttf")
          );
          doc.font("Arabic");
        } catch (error) {
          console.log(
            "⚠️ Arabic font not found, using default font with Unicode support"
          );
        }
      }

      // Helper function to add text with proper direction
      const addText = (text, options = {}) => {
        if (isArabic) {
          return doc.text(text, {
            ...options,
            align: options.align || "right",
            features: ["rtla"],
            bidi: true,
          });
        } else {
          return doc.text(text, {
            ...options,
            align: options.align || "left",
          });
        }
      };

      const formatData = (data) => {
        if (isArabic) {
          return data.toString().split("").reverse().join("");
        }
        return data;
      };

      // Header
      doc.fontSize(20);
      addText(t.title, { align: "center" });
      doc.moveDown();

      // Agreement Number and Date
      doc.fontSize(12);
      if (isArabic) {
        addText(`${t.agreementNumber}: ${formatData(bookingData._id)}`, {
          align: "left",
        });
        addText(`${t.date}: ${formatData(new Date().toLocaleDateString())}`, {
          align: "left",
        });
      } else {
        addText(`${t.agreementNumber}: ${bookingData._id}`, { align: "right" });
        addText(`${t.date}: ${new Date().toLocaleDateString()}`, {
          align: "right",
        });
      }
      doc.moveDown();

      // Customer Information Section
      doc.fontSize(16);
      addText(t.customerInfo, { underline: true });
      doc.fontSize(12);
      addText(`${t.name}: ${formatData(bookingData.billingName)}`);
      addText(`${t.email}: ${formatData(bookingData.clientEmail)}`);
      addText(`${t.phone}: ${formatData(bookingData.billingPhone)}`);
      addText(`${t.pickupLocation}: ${formatData(bookingData.pickupLocation)}`);
      addText(
        `${t.dropoffLocation}: ${formatData(bookingData.dropoffLocation)}`
      );
      doc.moveDown();

      // Vehicle Information Section
      doc.fontSize(16);
      addText(t.vehicleDetails, { underline: true });
      doc.fontSize(12);
      addText(`${t.brand}: ${formatData(bookingData.carId.brand)}`);
      addText(`${t.model}: ${formatData(bookingData.carId.model)}`);
      addText(`${t.year}: ${formatData(bookingData.carId.year)}`);
      addText(
        `${t.licensePlate}: ${formatData(bookingData.carId.licensePlate)}`
      );
      addText(
        `${t.transmission}: ${formatData(bookingData.carId.transmission)}`
      );
      addText(`${t.fuelType}: ${formatData(bookingData.carId.fuel_type)}`);
      addText(`${t.seats}: ${formatData(bookingData.carId.seats)}`);
      addText(`${t.color}: ${formatData(bookingData.carId.color)}`);
      doc.moveDown();

      // Rental Period Section
      doc.fontSize(16);
      addText(t.rentalPeriod, { underline: true });
      doc.fontSize(12);

      addText(
        `${t.startDate}: ${formatData(
          bookingData.startDate.toLocaleDateString()
        )}`
      );
      addText(
        `${t.endDate}: ${formatData(bookingData.endDate.toLocaleDateString())}`
      );
      addText(`${t.withDriver}: ${bookingData.with_driver ? t.yes : t.no}`);
      doc.moveDown();

      // Pricing Section
      doc.fontSize(16);
      addText(t.pricingBreakdown, { underline: true });
      doc.fontSize(12);
      addText(
        `${t.dailyRate}: ${formatData(bookingData.carId.rentalRatePerDay)} ${
          t.egp
        }`
      );
      addText(
        `${t.hourlyRate}: ${formatData(bookingData.carId.rentalRatePerHour)} ${
          t.egp
        }`
      );
      addText(
        `${t.depositRequired}: ${formatData(
          bookingData.carId.depositRequired
        )} ${t.egp}`
      );
      addText(`${t.totalCost}: ${formatData(bookingData.totalCost)} ${t.egp}`);
      addText(
        `${t.insurance}: ${formatData(bookingData.carId.insuranceStatus)}`
      );
      doc.moveDown();

      // Terms and Conditions
      doc.fontSize(16);
      addText(t.termsConditions, { underline: true });
      doc.fontSize(10);
      t.terms.forEach((term) => {
        addText(term);
      });
      doc.moveDown();

      // Privacy Policy Section
      doc.fontSize(14);
      addText(t.privacyPolicy, { underline: true });
      doc.fontSize(10);
      addText(t.privacyText);
      doc.moveDown();

      // Liability Waiver
      doc.fontSize(14);
      addText(t.liabilityWaiver, { underline: true });
      doc.fontSize(10);
      addText(t.liabilityText);
      doc.moveDown();

      // Digital Signature Section
      doc.fontSize(14);
      addText(t.digitalSignature, { underline: true });

      if (signatureData) {
        addText(t.customerSignature, { continued: false });
        // Handle base64 data URL or plain base64
        let base64 = signatureData;
        // Remove data URL prefix if present
        if (base64.startsWith("data:image")) {
          base64 = base64.split(",")[1];
        }
        try {
          doc.image(Buffer.from(base64, "base64"), {
            fit: [200, 100],
            align: isArabic ? "right" : "left",
            valign: "top",
          });
        } catch (err) {
          addText(t.signatureError);
        }
        addText(`${t.signedOn} ${formatData(new Date().toLocaleString())}`);
      } else {
        addText(`${t.signatureRequired} ________________________`);
        addText(`${t.date}: ________________________`);
      }

      doc.moveDown();

      // Agreement Acceptance
      doc.fontSize(10);
      addText(t.agreementAcceptance);

      // Footer
      doc
        .fontSize(8)
        .text(t.footer, 50, doc.page.height - 50, { align: "center" });

      doc.end();

      stream.on("finish", () => {
        resolve({
          filename,
          filepath,
          url: `${
            process.env.BASE_URL || "http://localhost:5000"
          }/uploads/agreements/${filename}`,
        });
      });

      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
};
