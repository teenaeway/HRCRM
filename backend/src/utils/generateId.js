import supabase from './supabase.js';

export const generateDisplayId = async (modelName, prefix) => {
  const tableName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('displayId')
    .order('createdAt', { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch last record for ${tableName}: ${error.message}`);
  }

  const lastRecord = data && data.length > 0 ? data[0] : null;

  let nextNum = 1;
  if (lastRecord && lastRecord.displayId && lastRecord.displayId.startsWith(prefix)) {
    const numPart = lastRecord.displayId.substring(prefix.length);
    const parsed = parseInt(numPart, 10);
    if (!isNaN(parsed)) {
      nextNum = parsed + 1;
    }
  } else if (lastRecord) {
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw new Error(`Failed to count records for ${tableName}: ${countError.message}`);
    }
    nextNum = (count || 0) + 1;
  }

  return `${prefix}${String(nextNum).padStart(2, '0')}`;
};
