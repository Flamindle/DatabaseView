/**
 * 将UTC时间转换为中国时区（东八区）的YYYY-MM-DD HH:mm:ss格式
 * @param {String/Date} time - 原始时间（ISO格式字符串/Date对象）
 * @returns {String} 格式化后的时间字符串
 */
function formatChinaTime(time) {
  if (!time) return '';

  // 转为Date对象
  const date = new Date(time);

  // 使用中国时区格式化（东八区）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 拼接为目标格式：YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

module.exports = { formatChinaTime };
