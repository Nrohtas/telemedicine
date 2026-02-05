import Navbar from "@/components/Navbar";
import SoftCard from "@/components/ui/SoftCard";
import SoftButton from "@/components/ui/SoftButton";

export default function Home() {
  const stats = [
    { label: "จำนวนการรับบริการ", value: "1,240", unit: "ครั้ง", trend: "+12%", color: "text-nm-primary" },
    { label: "จำนวนผู้มารับบริการ", value: "850", unit: "ราย", trend: "+5%", color: "text-green-500" },
    { label: "ระยะเวลารอเฉลี่ย", value: "12", unit: "นาที", trend: "-2%", color: "text-orange-400" },
    { label: "ความพึงพอใจ", value: "98", unit: "%", trend: "+1%", color: "text-purple-500" },
  ];

  return (
    <main className="min-h-screen pb-12">
      <Navbar />

      <div className="px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stats Section */}
        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <SoftCard key={idx} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-bold opacity-60 uppercase tracking-widest">{stat.label}</span>
                <span className={`text-xs font-bold ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.trend}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-sm opacity-60">{stat.unit}</span>
              </div>
            </SoftCard>
          ))}
        </div>

        {/* Main Chart Section */}
        <div className="lg:col-span-8 space-y-8">
          <SoftCard className="p-8 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold">สถิติการรับบริการรายเดือน</h3>
              <div className="flex gap-2">
                <SoftButton className="text-xs px-3 py-1">รายวัน</SoftButton>
                <SoftButton className="text-xs px-3 py-1" active>รายเดือน</SoftButton>
              </div>
            </div>

            {/* Mock Chart Visualization */}
            <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-4">
              {[40, 65, 45, 80, 55, 90, 75, 40, 85, 60, 45, 70].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-nm-primary opacity-80 shadow-nm-sm transition-all duration-500 hover:opacity-100 cursor-pointer"
                    style={{ height: `${h}%` }}
                  ></div>
                  <span className="text-[10px] opacity-50 uppercase font-bold text-center">
                    {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][i]}
                  </span>
                </div>
              ))}
            </div>
          </SoftCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <SoftCard className="p-6">
              <h3 className="text-lg font-bold mb-4">กลุ่มโรคที่รับบริการสูงสุด</h3>
              <div className="space-y-4">
                {[
                  { name: "ความดันโลหิตสูง", count: 420, percent: 75 },
                  { name: "เบาหวาน", count: 280, percent: 50 },
                  { name: "โรคทางเดินหายใจ", count: 150, percent: 30 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="font-bold">{item.count}</span>
                    </div>
                    <div className="h-3 w-full nm-card inset rounded-full overflow-hidden">
                      <div
                        className="h-full bg-nm-primary rounded-full"
                        style={{ width: `${item.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </SoftCard>

            <SoftCard className="p-6">
              <h3 className="text-lg font-bold mb-4">สถานะการเชื่อมต่อ</h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full nm-card flex items-center justify-center text-green-500">
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div>
                    <p className="font-bold">ระบบ HIS</p>
                    <p className="text-xs opacity-60">เชื่อมต่อล่าสุด: 2 นาทีที่แล้ว</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full nm-card flex items-center justify-center text-nm-primary">
                    <div className="w-4 h-4 rounded-full bg-nm-primary animate-pulse"></div>
                  </div>
                  <div>
                    <p className="font-bold">Telemedicine API</p>
                    <p className="text-xs opacity-60">เชื่อมต่อล่าสุด: 1 นาทีที่แล้ว</p>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="lg:col-span-4 space-y-8">
          <SoftCard className="p-6">
            <h3 className="text-lg font-bold mb-6 text-center">ภาพรวมเป้าหมาย</h3>
            <div className="relative w-48 h-48 mx-auto mb-6">
              <div className="w-full h-full rounded-full nm-card flex items-center justify-center">
                <div className="w-36 h-36 rounded-full nm-inset flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-nm-primary">85%</span>
                  <span className="text-[10px] opacity-60 font-bold uppercase tracking-widest text-center">ของทั้งหมด</span>
                </div>
              </div>
              <svg className="absolute top-0 left-0 w-full h-full -rotate-90 pointer-events-none">
                <circle
                  cx="96"
                  cy="96"
                  r="84"
                  fill="none"
                  stroke="var(--nm-primary)"
                  strokeWidth="12"
                  strokeDasharray="527"
                  strokeDashoffset={527 * (1 - 0.85)}
                  strokeLinecap="round"
                  className="translate-x-[0px] translate-y-[0px] opacity-20"
                />
              </svg>
            </div>
            <p className="text-sm text-center opacity-60">
              ดำเนินงานสำเร็จไปแล้ว <span className="font-bold text-foreground">8,450</span> จากเป้าหมาย <span className="font-bold text-foreground">10,000</span> ครั้ง
            </p>
          </SoftCard>

          <SoftCard className="p-6 overflow-hidden">
            <h3 className="text-lg font-bold mb-4">กิจกรรมล่าสุด</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 p-3 nm-flat rounded-2xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shadow-inner flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">พญ. สมรศรี รับเคสใหม่</p>
                    <p className="text-[10px] opacity-60">เมื่อ 5 นาทีที่แล้ว</p>
                  </div>
                </div>
              ))}
            </div>
            <SoftButton className="w-full mt-6 text-sm py-3">
              ดูทั้งหมด
            </SoftButton>
          </SoftCard>
        </div>
      </div>
    </main>
  );
}
