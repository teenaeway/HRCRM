import supabase from '../utils/supabase.js';
import { generateDisplayId } from '../utils/generateId.js';

export const getClients = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = supabase.from('Client').select('*, employee:Employee(id, name, email)', { count: 'exact' });

    if (role === 'admin') {
      // no additional filters
    } else if (role === 'employee') {
      query = query.eq('employeeId', userId);
    } else {
      return res.status(403).json({ message: 'Forbidden: Invalid role' });
    }

    const { data: clients, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limitNum - 1);

    if (error) throw error;

    res.json({
      data: clients,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new client (Admin only)
export const createClient = async (req, res) => {
  try {
    const { name, recruitmentPositionRequired, contactName, email, phone, employeeId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    const displayId = await generateDisplayId('Client', 'CL');

    const { data: client, error } = await supabase
      .from('Client')
      .insert({
        displayId,
        name,
        recruitmentPositionRequired,
        contactName,
        email,
        phone,
        employeeId: employeeId || null,
      })
      .select('*, employee:Employee(id, name, email)')
      .single();

    if (error) throw error;

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an existing client (Admin only)
export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, recruitmentPositionRequired, contactName, email, phone, employeeId } = req.body;

    const { data: existingClient, error: findError } = await supabase.from('Client').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { data: client, error } = await supabase
      .from('Client')
      .update({
        name,
        recruitmentPositionRequired,
        contactName,
        email,
        phone,
        employeeId: employeeId !== undefined ? employeeId : existingClient.employeeId,
      })
      .eq('id', id)
      .select('*, employee:Employee(id, name, email)')
      .single();

    if (error) throw error;

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a client (Admin only)
export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existingClient, error: findError } = await supabase.from('Client').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const { error } = await supabase.from('Client').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Assign employee to a client (Admin only)
export const assignEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    const { data: existingClient, error: findError } = await supabase.from('Client').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existingClient) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (employeeId) {
      const { data: employeeExists, error: empError } = await supabase.from('Employee').select('id').eq('id', employeeId).maybeSingle();
      if (empError) throw empError;
      if (!employeeExists) {
        return res.status(400).json({ message: 'Employee not found' });
      }
    }

    const { data: client, error } = await supabase
      .from('Client')
      .update({
        employeeId: employeeId || null,
      })
      .eq('id', id)
      .select('*, employee:Employee(id, name, email)')
      .single();

    if (error) throw error;

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get list of all employees (Admin only, for dropdown assignment)
export const getEmployees = async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('Employee')
      .select('id, name, email')
      .order('name', { ascending: true });

    if (error) throw error;

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
