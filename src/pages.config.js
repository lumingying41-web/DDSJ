import Admin from './pages/Admin';
import Home from './pages/Home';
import Institution from './pages/Institution';
import LanguageSelector from './pages/LanguageSelector';
import NewsDetail from './pages/NewsDetail';
import PaymentMethod from './pages/PaymentMethod';
import PaymentQRCode from './pages/PaymentQRCode';
import Preferences from './pages/Preferences';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import ReportDetail from './pages/ReportDetail';
import Research from './pages/Research';
import ResearchDetail from './pages/ResearchDetail';
import Search from './pages/Search';
import Subscription from './pages/Subscription';
import Feedback from './pages/Feedback';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Home": Home,
    "Institution": Institution,
    "LanguageSelector": LanguageSelector,
    "NewsDetail": NewsDetail,
    "PaymentMethod": PaymentMethod,
    "PaymentQRCode": PaymentQRCode,
    "Preferences": Preferences,
    "PrivacyPolicy": PrivacyPolicy,
    "Profile": Profile,
    "ReportDetail": ReportDetail,
    "Research": Research,
    "ResearchDetail": ResearchDetail,
    "Search": Search,
    "Subscription": Subscription,
    "Feedback": Feedback,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};