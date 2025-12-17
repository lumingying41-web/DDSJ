import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#070D18]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#070D18]/95 backdrop-blur-lg border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Profile')}>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            隐私政策
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="p-6 md:p-8">
              <div className="prose prose-invert prose-sm max-w-none">
                {/* Header Info */}
                <div className="text-center mb-8 pb-6 border-b border-slate-700/50">
                  <p className="text-slate-400 text-sm mb-1">最近更新日期：2025 年 12 月 17 日</p>
                  <p className="text-slate-400 text-sm">生效日期：2025 年 12 月 18 日</p>
                </div>

                {/* Introduction */}
                <div className="mb-8">
                  <p className="text-slate-300 leading-relaxed">
                    欢迎您使用<strong className="text-white">顶点视角</strong>（以下简称"本应用"、"我们"）。
                    我们高度重视用户的隐私和个人信息保护。本隐私政策用于说明您在使用本应用及相关服务时，我们如何收集、使用、存储和保护您的个人信息。
                  </p>
                  <p className="text-amber-400 mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-sm">
                    在使用本应用前，请您仔细阅读并理解本隐私政策。您开始使用本应用，即视为您已同意本隐私政策的全部内容。
                  </p>
                </div>

                {/* Section 1 */}
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="text-amber-400">一、</span>我们收集的信息
                </h2>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">1. 您主动提供的信息</h3>
                <p className="text-slate-300 mb-2">在使用本应用过程中，您可能会主动向我们提供以下信息：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 注册或登录信息（如邮箱地址，或通过 Apple、Google 等第三方账号授权获得的基础账户信息）</li>
                  <li>• 您通过意见反馈、客服支持等方式提交的信息</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">2. 自动收集的信息</h3>
                <p className="text-slate-300 mb-2">为保障应用正常运行和服务质量，我们可能会自动收集：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 设备信息（设备型号、操作系统版本、应用版本）</li>
                  <li>• 网络信息（IP 地址、所在国家或地区）</li>
                  <li>• 使用数据（访问时间、浏览内容、功能使用情况）</li>
                  <li>• 应用运行日志、错误日志和崩溃信息</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">3. 推送通知相关信息</h3>
                <p className="text-slate-300 mb-2">如您开启通知权限，我们可能会向您发送：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 重要资讯提醒</li>
                  <li>• 功能更新或服务通知</li>
                </ul>
                <p className="text-slate-400 text-sm mt-2">您可随时在设备系统设置中关闭通知权限。</p>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">4. 订阅与支付说明</h3>
                <p className="text-slate-300 mb-2">如您通过 Apple App Store 或 Google Play 进行订阅：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 支付行为由 Apple 或 Google 完成</li>
                  <li>• 我们不会收集或存储您的支付账号、银行卡或账单信息</li>
                  <li>• 我们仅接收订阅状态结果（如是否已订阅）</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">5. 我们不会收集的信息</h3>
                <p className="text-slate-300 mb-2">我们不会主动收集以下信息：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 银行卡号、支付密码</li>
                  <li>• 证券账户、交易账户信息</li>
                  <li>• 身份证件或政府签发的身份信息</li>
                  <li>• 任何用于证券交易或投资执行的数据</li>
                </ul>

                {/* Section 2 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">二、</span>信息的使用目的
                </h2>
                <p className="text-slate-300 mb-2">我们仅在合法、正当、必要的范围内使用您的信息，用于：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 提供、维护和优化资讯内容服务</li>
                  <li>• 改善应用性能和用户体验</li>
                  <li>• 进行统计分析和产品改进</li>
                  <li>• 保障账户安全、防止滥用和欺诈</li>
                  <li>• 响应用户咨询和支持请求</li>
                </ul>
                <p className="text-amber-400 mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20 text-sm">
                  本应用不提供投资建议、不进行交易撮合、不代替用户作出任何投资决策。
                </p>

                {/* Section 3 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">三、</span>数据处理的法律依据
                </h2>
                <p className="text-slate-300 mb-2">在适用法律（如 GDPR）要求的情况下，我们基于以下合法依据处理个人信息：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 您的明确同意</li>
                  <li>• 履行服务协议所必需</li>
                  <li>• 遵守法律义务</li>
                  <li>• 合理的业务运营和安全需求</li>
                </ul>

                {/* Section 4 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">四、</span>信息的存储与安全
                </h2>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">1. 信息存储</h3>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 您的个人信息将存储在安全的服务器中</li>
                  <li>• 数据仅在实现本隐私政策所述目的所必需的期限内保存</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mt-6 mb-3">2. 安全措施</h3>
                <p className="text-slate-300 mb-2">我们采取合理的技术和管理措施保护您的信息，包括但不限于：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• HTTPS 加密传输</li>
                  <li>• 权限控制与内部管理制度</li>
                  <li>• 系统监控与安全维护</li>
                </ul>
                <p className="text-slate-400 text-sm mt-2">但请理解，任何网络环境下的数据传输均无法保证绝对安全。</p>

                {/* Section 5 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">五、</span>信息的共享、披露与转让
                </h2>
                <p className="text-slate-300 mb-2">我们不会出售、出租或交易您的个人信息。</p>
                <p className="text-slate-300 mb-2">在以下情况下，我们可能依法共享或披露信息：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 已获得您的明确授权</li>
                  <li>• 根据法律法规、司法程序或监管要求</li>
                  <li>• 为保护用户、本应用或公众的合法权益与安全</li>
                </ul>

                {/* Section 6 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">六、</span>第三方服务
                </h2>
                <p className="text-slate-300 mb-2">本应用可能集成第三方服务，包括但不限于：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 数据统计与分析服务</li>
                  <li>• 崩溃分析与性能监测服务</li>
                  <li>• 推送通知服务</li>
                  <li>• 第三方账号登录服务</li>
                </ul>
                <p className="text-slate-400 text-sm mt-2">
                  上述第三方将依据其各自的隐私政策独立处理相关信息，我们建议您在使用前查阅其隐私政策。
                </p>

                {/* Section 7 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">七、</span>您的权利
                </h2>
                <p className="text-slate-300 mb-2">根据您所在地区的适用法律，您可能享有以下权利：</p>
                <ul className="text-slate-300 space-y-2 ml-4">
                  <li>• 访问、查询您的个人信息</li>
                  <li>• 更正或删除您的个人信息</li>
                  <li>• 撤回已授予的同意</li>
                  <li>• 请求限制或停止数据处理</li>
                  <li>• 注销账户（如提供该功能）</li>
                </ul>
                <p className="text-slate-400 text-sm mt-2">
                  如需行使上述权利，请通过本政策末尾的联系方式与我们联系。
                </p>

                {/* Section 8 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">八、</span>未成年人保护
                </h2>
                <p className="text-slate-300 mb-2">
                  本应用不面向<strong className="text-white">未满 18 周岁</strong>的未成年人提供服务。
                </p>
                <p className="text-slate-300">
                  我们不会在知情的情况下收集未成年人的个人信息。如发现相关情况，我们将及时删除。
                </p>

                {/* Section 9 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">九、</span>隐私政策的变更
                </h2>
                <p className="text-slate-300 mb-2">我们可能会不时更新本隐私政策。</p>
                <p className="text-slate-300">
                  如发生重大变更，我们将通过应用内通知或其他合理方式告知您。您继续使用本应用即视为接受更新后的隐私政策。
                </p>

                {/* Section 10 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">十、</span>免责声明（重要）
                </h2>
                <p className="text-red-400 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  本应用所提供的所有内容仅用于信息展示与研究参考，不构成任何形式的投资建议、金融建议、要约或承诺。用户应自行判断并承担使用信息的相关风险。
                </p>

                {/* Section 11 */}
                <h2 className="text-xl font-bold text-white mb-4 mt-8 flex items-center gap-2">
                  <span className="text-amber-400">十一、</span>联系我们
                </h2>
                <p className="text-slate-300 mb-4">
                  如您对本隐私政策有任何疑问、意见或请求，请通过以下方式联系我们：
                </p>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <p className="text-slate-300">
                    <strong className="text-white">公司名称：</strong>广西图灵时代应用软件开发有限责任公司
                  </p>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-amber-400" />
                    <strong className="text-white">联系邮箱：</strong>
                    <a href="mailto:lumingying41@gmail.com" className="text-amber-400 hover:underline">
                      lumingying41@gmail.com
                    </a>
                    <span className="text-slate-500">/</span>
                    <a href="mailto:1872380452@qq.com" className="text-amber-400 hover:underline">
                      1872380452@qq.com
                    </a>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
                  <p className="text-slate-500 text-sm">感谢您对顶点视角的信任与支持</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}