import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with your credentials
const supabaseUrl = 'https://aauuecbslidjegrbgkid.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhdXVlY2JzbGlkamVncmJna2lkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjAxOTI2NSwiZXhwIjoyMDYxNTk1MjY1fQ.kbWYrelpxXM12IiLl90Y1TY6Yxf6JTfVA8mv0u6NMXk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // Query the pg_tables view to get all tables in the public schema
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      console.error('Error fetching tables:', error);
      return;
    }

    console.log('Current tables in the database:');
    data.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });

    // Tables we want to keep for the simplified app
    const tablesToKeep = ['auth', 'users', 'sessions'];
    
    // Tables that can be safely removed
    const tablesToRemove = data
      .map(table => table.tablename)
      .filter(tableName => {
        // Keep auth-related tables and essential tables
        return !tableName.startsWith('auth_') && 
               !tablesToKeep.includes(tableName) &&
               tableName !== '_prisma_migrations' &&
               tableName !== 'pg_tables';
      });

    console.log('\nTables that can be safely removed:');
    tablesToRemove.forEach((tableName, index) => {
      console.log(`${index + 1}. ${tableName}`);
    });

    return { allTables: data.map(t => t.tablename), tablesToRemove };
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

async function dropTable(tableName) {
  try {
    // Execute raw SQL to drop the table
    const { error } = await supabase.rpc('exec', { 
      query: `DROP TABLE IF EXISTS "${tableName}" CASCADE;` 
    });

    if (error) {
      console.error(`Error dropping table ${tableName}:`, error);
      return false;
    }

    console.log(`Successfully dropped table: ${tableName}`);
    return true;
  } catch (err) {
    console.error(`Unexpected error dropping table ${tableName}:`, err);
    return false;
  }
}

async function main() {
  const { tablesToRemove } = await listTables();
  
  if (!tablesToRemove || tablesToRemove.length === 0) {
    console.log('No tables to remove.');
    return;
  }

  console.log('\nWould you like to remove these tables? (yes/no)');
  // In a real interactive script, you would get user input here
  // For safety, we're not automatically removing tables
  console.log('For safety, tables will not be automatically removed.');
  console.log('To remove tables, uncomment the code in the script and run it again.');

  // Uncomment this section to actually drop tables
  /*
  for (const tableName of tablesToRemove) {
    console.log(`Dropping table: ${tableName}...`);
    const success = await dropTable(tableName);
    if (success) {
      console.log(`✓ Table ${tableName} removed successfully.`);
    } else {
      console.log(`✗ Failed to remove table ${tableName}.`);
    }
  }
  */
}

main();
