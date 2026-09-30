

export const isObjectEmpty = (objectName:object) => {
    return JSON.stringify(objectName) === "{}";
}

const month = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const dateTimeOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Edmonton',
    weekday: "long",
    year: "numeric",
month: 'long',
day: '2-digit',
hour: '2-digit',
minute: '2-digit',
second: '2-digit',
};

const dateOnlyOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/Edmonton',
    weekday: "long",
    year: "numeric",
month: 'long',
day: '2-digit',
};

// Get the current date and time in Edmonton, Canada
// Note: The time zone offset for Edmonton is -06:00 (Mountain Daylight Time - MDT)

export const getCurrentDateInEdmonton = () => {
    const edmontonDateTime = new Date().toLocaleString('en-US', dateOnlyOptions);
    return new Date(edmontonDateTime); 
}

export const getCurrentDateInEdmontonAsString = () => {
    return new Date().toLocaleString('en-US', dateOnlyOptions);
}

export const getCurrentDateTimeInEdmontonAsString = () => {
    return new Date().toLocaleString('en-US', dateTimeOptions);
}

const today = getCurrentDateInEdmonton()
export const currentDay = today.getDate()
export const currentMonth = today.getMonth()
export const currentYear = today.getFullYear()



// Computed per call: module-level values go stale on a warm serverless instance
export const getMonthName = () => {
    return month[getCurrentDateInEdmonton().getMonth()]
}

export const getMonthShortName = () => {
    return monthShort[getCurrentDateInEdmonton().getMonth()]
}

export const getWeekday = (date:Date) => {
    return weekday[date.getDay()];
}

export const getWeekdayByDay = (day: number) => {
    const now = getCurrentDateInEdmonton()
    const dateToProcess = new Date(now.getFullYear(), now.getMonth(), day)
    return getWeekday(dateToProcess)
}
 
export const getHijriDateAsString = (date:Date) => {
    return new Intl.DateTimeFormat('ar-TN-u-ca-islamic-umalqura', {calendar: "islamic-umalqura", day: 'numeric', month: 'long',year : 'numeric'}).format(date)
}

export const getHijriShortDateAsString = (date:Date) => {
    return new Intl.DateTimeFormat('ar-TN-u-ca-islamic-umalqura', {calendar: "islamic-umalqura", day: 'numeric', month: 'long'}).format(date)
}
  