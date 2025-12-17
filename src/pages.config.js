import Home from './pages/Home';
import NewsDetail from './pages/NewsDetail';
import Research from './pages/Research';
import ResearchDetail from './pages/ResearchDetail';
import Institution from './pages/Institution';
import ReportDetail from './pages/ReportDetail';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Preferences from './pages/Preferences';
import Search from './pages/Search';
import LanguageSelector from './pages/LanguageSelector';
import PaymentMethod from './pages/PaymentMethod';
import PrivacyPolicy from './pages/PrivacyPolicy';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "NewsDetail": NewsDetail,
    "Research": Research,
    "ResearchDetail": ResearchDetail,
    "Institution": Institution,
    "ReportDetail": ReportDetail,
    "Subscription": Subscription,
    "Profile": Profile,
    "Preferences": Preferences,
    "Search": Search,
    "LanguageSelector": LanguageSelector,
    "PaymentMethod": PaymentMethod,
    "PrivacyPolicy": PrivacyPolicy,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};