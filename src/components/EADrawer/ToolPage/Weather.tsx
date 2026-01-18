import type { WeatherSearchItem } from "@/store/store";
interface WeatherProps {
  weatherData: WeatherSearchItem[];
}
const Weather = ({ weatherData }: WeatherProps) => {
  // 如果不是数组，则默认为空数组
  const dataArray = Array.isArray(weatherData) ? weatherData : [];

  if (dataArray.length === 0) {
    return <div className="text-center">暂无数据</div>;
  }

  return (
    <div>
      {dataArray.map((item: WeatherSearchItem) => (
        <div
          key={item.ymd}
          className="w-full mt-2 p-3 rounded-xl bg-gradient-to-br from-blue-50/40 to-white/10 backdrop-blur-sm border border-[var(--chat-border)] shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-200 flex flex-col gap-2 text-sm"
        >
          {/* 顶部：日期 + AQI */}
          <div className="flex justify-between items-center">
            <div className="font-semibold text-[var(--Ai-content-text)]">
              📅 {item.ymd} ({item.week})
            </div>
            <div className="px-2 py-0.5 rounded-full text-xs font-medium">
              AQI: {item.aqi}
            </div>
          </div>

          {/* 中间：温度 & 天气/风向 */}
          <div className="flex justify-between items-center mt-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--Ai-think-text)]">🌡 温度</span>
              <span className="font-medium">
                {item.low} ~ {item.high}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5 text-[var(--Ai-think-text)]">
              <span>☀️ {item.type}</span>
              <span>
                💨 {item.fx} {item.fl}
              </span>
            </div>
          </div>

          {/* 底部：日出日落 */}
          <div className="flex justify-between mt-1 text-[var(--Ai-think-text)]">
            <span>🌅 {item.sunrise}</span>
            <span>🌇 {item.sunset}</span>
          </div>

          {/* 小贴士 */}
          <div className="mt-1 p-2 bg-white/20 rounded-lg text-[var(--Ai-content-text)] italic shadow-inner text-xs">
            📝 {item.notice}
          </div>
        </div>
      ))}
    </div>
  );
};
export default Weather;
