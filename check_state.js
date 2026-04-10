const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://orzhjgrjpxrlikswwenc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9yemhqZ3JqcHhybGlrc3d3ZW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNzIwNzMsImV4cCI6MjA5MDg0ODA3M30.wRTYCtHvkDfLXQTB6rktUUUbu27e4GpzJMwzSXsloUE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  let output = "--- SCHEMA CHECK ---\n";
  const tables = ['products', 'orders', 'profiles'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      output += `Table [${table}] ERROR: ${error.message} (Code: ${error.code})\n`;
    } else {
      output += `Table [${table}] OK. Columns: ${data[0] ? Object.keys(data[0]).join(', ') : 'Empty Data'}\n`;
    }
  }
  
  fs.writeFileSync('schema_output.txt', output);
  console.log("Written to schema_output.txt");
}

checkSchema();
