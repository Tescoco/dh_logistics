export const RGS_CITIES: string[] = (() => {
  const fnBody = function () {
    /*
Riyadh
Jeddah
Abha
Khamis Mushait
Dammam
Dhahran
Khobar
Ras Tanura
Safwa
Anak
Qatif
Saihat
Tarut
Hofuf
AlMubarraz
Hassa
Jubail
Jizan
Abu Arish
Sabya
Madinah
Makkah
Tabuk
*/
  }.toString();
  const start = fnBody.indexOf("/*") + 2;
  const end = fnBody.lastIndexOf("*/");
  return fnBody
    .substring(start, end)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
})();

export default RGS_CITIES;
