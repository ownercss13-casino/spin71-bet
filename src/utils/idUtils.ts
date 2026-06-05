export const formatDisplayUID = (uid: string) => {
  if (!uid) return 'N/A';
  return uid.substring(0, 6) + '...';
};
