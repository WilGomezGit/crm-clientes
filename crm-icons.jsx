// CatalogoCRM — Icon components (Heroicons outline style)
const I = ({ d, d2, size = 20, className = '', fill = 'none', strokeWidth = 1.75 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const IconDashboard = (p) => <I {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" strokeWidth={1.6} />;
const IconUsers = (p) => <I {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" d2="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z" />;
const IconShoppingBag = (p) => <I {...p} d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />;
const IconMessage = (p) => <I {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />;
const IconUpload = (p) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />;
const IconSettings = (p) => <I {...p} d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeWidth={1.5} />;
const IconSearch = (p) => <I {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />;
const IconPlus = (p) => <I {...p} d="M12 5v14M5 12h14" strokeWidth={2} />;
const IconX = (p) => <I {...p} d="M18 6L6 18M6 6l12 12" strokeWidth={2} />;
const IconCheck = (p) => <I {...p} d="M5 13l4 4L19 7" strokeWidth={2.5} />;
const IconChevronRight = (p) => <I {...p} d="M9 18l6-6-6-6" strokeWidth={2} />;
const IconChevronDown = (p) => <I {...p} d="M6 9l6 6 6-6" strokeWidth={2} />;
const IconChevronLeft = (p) => <I {...p} d="M15 18l-6-6 6-6" strokeWidth={2} />;
const IconBell = (p) => <I {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />;
const IconMenu = (p) => <I {...p} d="M3 12h18M3 6h18M3 18h18" strokeWidth={2} />;
const IconPhone = (p) => <I {...p} d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />;
const IconMapPin = (p) => <I {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" d2="M12 10a1 1 0 100-2 1 1 0 000 2z" strokeWidth={1.6} />;
const IconEdit = (p) => <I {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />;
const IconTrash = (p) => <I {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />;
const IconEye = (p) => <I {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" d2="M12 15a3 3 0 100-6 3 3 0 000 6z" />;
const IconFilter = (p) => <I {...p} d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />;
const IconDownload = (p) => <I {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />;
const IconSend = (p) => <I {...p} d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />;
const IconClock = (p) => <I {...p} d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2" />;
const IconZap = (p) => <I {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />;
const IconTrendingUp = (p) => <I {...p} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />;
const IconPackage = (p) => <I {...p} d="M16.5 9.4L7.5 4.21M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 001 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" d2="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />;
const IconLogOut = (p) => <I {...p} d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />;
const IconUser = (p) => <I {...p} d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />;
const IconGrid = (p) => <I {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" strokeWidth={1.6} />;
const IconList = (p) => <I {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeWidth={2} />;
const IconWhatsapp = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const IconStar = (p) => <I {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
const IconCopy = (p) => <I {...p} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2M10 20h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />;
const IconRefresh = (p) => <I {...p} d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />;
const IconInfo = (p) => <I {...p} d="M12 22a10 10 0 100-20 10 10 0 000 20zM12 8h.01M11 12h1v4h1" />;
const IconCloud = (p) => <I {...p} d="M17.5 19c2.5 0 4.5-2 4.5-4.5 0-2.3-1.7-4.2-3.9-4.5-.3-3.1-2.9-5.5-6-5.5-2.5 0-4.7 1.6-5.6 3.9-2 .5-3.5 2.3-3.5 4.6 0 2.5 2 4.5 4.5 4.5h10z" />;

const IconLink = (p) => <I {...p} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />;

Object.assign(window, {
  IconDashboard, IconUsers, IconShoppingBag, IconMessage, IconUpload, IconSettings,
  IconSearch, IconPlus, IconX, IconCheck, IconChevronRight, IconChevronDown, IconChevronLeft,
  IconBell, IconMenu, IconPhone, IconMapPin, IconEdit, IconTrash, IconEye,
  IconFilter, IconDownload, IconSend, IconClock, IconZap, IconTrendingUp,
  IconPackage, IconLogOut, IconUser, IconGrid, IconList, IconWhatsapp,
  IconStar, IconCopy, IconRefresh, IconInfo, IconCloud, IconLink
});
