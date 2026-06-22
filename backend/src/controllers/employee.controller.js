import bcrypt from 'bcryptjs';
import supabase from '../utils/supabase.js';
import { generateDisplayId } from '../utils/generateId.js';

// ── Get All Employees ─────────────────────────────────────────────
export const getEmployees = async (req, res) => {
  try {
    const { data: employees, error } = await supabase
      .from('Employee')
      .select('id, displayId, name, email, phone, address, createdAt')
      .order('createdAt', { ascending: false });

    if (error) throw error;

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Create Employee (Admin Only) ──────────────────────────────────
export const createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, Email, and Password are required' });
    }

    const { data: existing, error: findError } = await supabase.from('Employee').select('id').eq('email', email).maybeSingle();
    if (findError) throw findError;
    if (existing) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const displayId = await generateDisplayId('Employee', 'E');

    const { data: employee, error } = await supabase
      .from('Employee')
      .insert({
        displayId,
        name,
        email,
        password: hashedPassword,
        phone,
        address,
      })
      .select('id, displayId, name, email, phone, address, createdAt')
      .single();

    if (error) throw error;

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Employee (Admin Only) ──────────────────────────────────
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, phone, address } = req.body;

    const { data: existing, error: findError } = await supabase.from('Employee').select('id').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const dataToUpdate = { name, email, phone, address };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(password, salt);
    }

    const { data: employee, error } = await supabase
      .from('Employee')
      .update(dataToUpdate)
      .eq('id', id)
      .select('id, displayId, name, email, phone, address')
      .single();

    if (error) throw error;

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delete Employee (Admin Only) ──────────────────────────────────
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: findError } = await supabase.from('Employee').select('id').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Since Client foreign key employeeId has ON DELETE SET NULL, we don't strictly need to updateMany manually,
    // and ActivityLog has ON DELETE CASCADE. But let's do it explicitly if needed, or let postgres handle it.
    // Assuming our SQL tables have these foreign key constraints, we can just delete the employee.
    const { error } = await supabase.from('Employee').delete().eq('id', id);
    if (error) throw error;

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
