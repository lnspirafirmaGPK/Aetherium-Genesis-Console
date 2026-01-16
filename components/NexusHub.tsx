import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import type { AppTab } from '../types';

interface NexusHubProps {
    user: {
        name: string;
        email: string;
        role: string;
        picture: string;
    };
    onLaunchModule: (tab: AppTab | 'aether-canvas' | 'settings') => void;
}

const ModuleCard: React.FC<{ title: string; icon: string; description: string; details: string[]; onClick: () => void; }> = 
({ title, icon, description, details, onClick }) => (
    <div className="glass-card p-6 cursor-pointer" onClick={onClick}>
        <div className="module-icon">{icon}</div>
        <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-sm mb-4">{description}</p>
        <ul className="text-xs text-gray-400 space-y-1">
            {details.map((detail, i) => <li key={i}>• {detail}</li>)}
        </ul>
    </div>
);

const OmniChannelCard: React.FC<{ title: string; icon: string; description: string; }> = 
({ title, icon, description }) => (
    <div className="glass-card p-6 cursor-pointer">
        <div className="module-icon">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-300 text-xs">{description}</p>
    </div>
);


export const NexusHub: React.FC<NexusHubProps> = ({ user, onLaunchModule }) => {
    const { t } = useLocalization();

    const handleLogout = () => {
        if (confirm('คุณต้องการออกจากระบบใช่หรือไม่?')) {
            sessionStorage.clear();
            window.location.reload();
        }
    };

    const isArchitect = user.role === 'architect';

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen overflow-y-auto p-8 relative">
            <div className="stars" id="stars-react"></div>
            <div className="fade-in">
                {/* Profile Header */}
                <div className="glass-card p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <img className="w-20 h-20 rounded-full border-3 border-purple-500/50" src={user.picture} alt="Profile" />
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <p className="text-gray-300">{user.email}</p>
                            <p className="text-purple-400 text-sm">{isArchitect ? '🏛️ สถาปนิก' : '👤 ผู้ใช้ทั่วไป'}</p>
                        </div>
                        <button onClick={handleLogout} className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors">
                            {t('logout')}
                        </button>
                    </div>
                </div>

                {/* Nexus Hub Title */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-white mb-2">โถงกลางแห่งการเชื่อมต่อ</h1>
                    <p className="text-xl text-purple-300">ประตูสู่ระบบนิเวศบริการระดับโลก</p>
                </div>

                {/* Module Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    <ModuleCard title="Firma IDE" icon="💻" description="สภาพแวดล้อมการพัฒนาแบบบูรณาการ" details={["สารบบ Firma", "เอดิเตอร์โค้ด", "กราฟ Aetherium"]} onClick={() => onLaunchModule('graph')} />
                    <ModuleCard title="AI Core" icon="🤖" description="ระบบวิเคราะห์และแก้ไขโค้ดอัจฉริยะ" details={["PRGX Sentry", "PRGX Mechanic", "Wisdom Engine"]} onClick={() => onLaunchModule('agent')} />
                    <ModuleCard title="CLI Extension Hub" icon="🖥️" description="จำลองการพัฒนาและจัดการส่วนขยาย" details={["การจัดการ Manifest", "Slash Commands", "การเชื่อมต่อ MCP Server"]} onClick={() => onLaunchModule('cli')} />
                    <ModuleCard title="Image Genesis" icon="🎨" description="การสร้างภาพด้วย AI" details={["สร้างภาพจากข้อความ", "Gemini Pro Image Preview", "การจัดการ API Keys"]} onClick={() => onLaunchModule('genesis')} />
                    <ModuleCard title="Image Analysis" icon="🔍" description="วิเคราะห์ภาพด้วย AI" details={["อัปโหลดและวิเคราะห์ภาพ", "ตอบคำถามเกี่ยวกับภาพ", "Gemini Pro Vision"]} onClick={() => onLaunchModule('analysis')} />
                    <ModuleCard title="Aether Canvas" icon="✨" description="โปรโตคอลเจเนซิส - การสร้างสรรค์ผ่านเสียง" details={["Gemini Live API (Voice)", "การสร้างภาพด้วยเสียง", "Particle Animation"]} onClick={() => onLaunchModule('aether-canvas')} />
                    <ModuleCard title="Data Fabric" icon="🌐" description="โครงสร้างข้อมูลและ Governance" details={["Data Pipeline (Bronze/Silver/Gold)", "Data Governance", "การควบคุมสิทธิ์ตามบทบาท"]} onClick={() => onLaunchModule('fabric')} />
                    <ModuleCard title="System Assurance" icon="🛡️" description="ระบบประกันคุณภาพและความสมบูรณ์" details={["สถานะการทดสอบอัตโนมัติ", "การสแกนความปลอดภัย", "การตรวจสอบ Compliance"]} onClick={() => onLaunchModule('assurance')} />
                    {isArchitect && <ModuleCard title="Economic Fabric" icon="💰" description="โครงข่ายเศรษฐกิจ (สถาปนิกเท่านั้น)" details={["Tier-based Economy", "Dynamic Pricing", "Architectural Royalty"]} onClick={() => onLaunchModule('economicFabric')} />}
                </div>

                {/* Omni-Channel Network */}
                <div className="text-center mt-16 mb-8">
                    <h2 className="text-4xl font-bold text-white mb-2">โครงข่าย Omni-Channel</h2>
                    <p className="text-lg text-purple-300">เชื่อมต่อทุกอุตสาหกรรมผ่านจุดเดียว</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto pb-8">
                    <OmniChannelCard title="Financial Nexus" icon="💹" description="ตลาดทุน, หุ้น, และสินทรัพย์ดิจิทัล" />
                    <OmniChannelCard title="Industrial Matrix" icon="🏭" description="ยานยนต์, พลังงาน, และการผลิต" />
                    <OmniChannelCard title="Retail & Logistics" icon="🛒" description="ค้าปลีก, FMCG, และซัพพลายเชน" />
                    <OmniChannelCard title="Hardware Interface" icon="🔌" description="เชื่อมต่อระดับชิปเซ็ตและฮาร์ดแวร์" />
                    <OmniChannelCard title="Global Media Hub" icon="🎬" description="Ecosystem ของ YouTube และสมาร์ทโฟน" />
                </div>
            </div>
            <style>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 20px;
                    transition: all 0.3s ease;
                }
                .glass-card:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(139, 92, 246, 0.5);
                    transform: translateY(-5px);
                }
                .module-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.6s ease-out;
                }
            `}</style>
        </div>
    );
};
