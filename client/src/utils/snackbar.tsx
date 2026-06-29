import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface PositionedSnackbarProps {
    open: boolean;
    message: string;
    success: boolean;
    onClose: () => void;
}

export default function PositionedSnackbar({ open, message, success, onClose }: PositionedSnackbarProps) {
    return (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={open}
            autoHideDuration={3000}
            onClose={onClose}
        >
            <Alert onClose={onClose} severity={success ? 'success' : 'error'} variant="filled">
                {message}
            </Alert>
        </Snackbar>
    );
}
