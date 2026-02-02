'use client';

import * as React from 'react';
import RouterLink from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Controller, useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import { paths } from '@/paths';
import { authClient } from '@/lib/auth/client';
import { useUser } from '@/hooks/use-user';
import { PrimaryColor } from '@/config';

const schema = zod.object({
  name: zod.string().min(1, { message: 'Name is required' }),
  phone: zod.string().min(1, { message: 'Phone number is required' }).regex(/^[0-9]{10,15}$/, { message: 'Invalid phone number' }),
  password: zod.string().min(6, { message: 'Password should be at least 6 characters' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = { name: '', phone: '', password: '' } satisfies Values;

export function SignUpForm(): React.JSX.Element {
  const router = useRouter();

  const { checkSession } = useUser();

  const [isPending, setIsPending] = React.useState<boolean>(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      const { error } = await authClient.signUp(values);

      if (error) {
        setError('root', { type: 'server', message: error });
        setIsPending(false);
        return;
      }

      // Refresh the auth state
      await checkSession?.();

      // UserProvider, for this case, will not refresh the router
      // After refresh, GuestGuard will handle the redirect
      router.refresh();
    },
    [checkSession, router, setError]
  );

  return (
    <Stack spacing={3} sx={{ color: 'common.white' }}>
      <Stack spacing={1}>
        <Typography variant="h4">Sign up</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Already have an account?{' '}
          <Link component={RouterLink} href={paths.auth.signIn} underline="hover" variant="subtitle2">
            Sign in
          </Link>
        </Typography>
      </Stack>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <FormControl error={Boolean(errors.name)}>
                <InputLabel
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': { color: PrimaryColor },
                  }}
                >
                  Name
                </InputLabel>
                <OutlinedInput
                  {...field}
                  label="Name"
                  sx={{
                    input: { color: '#fff' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                  }}
                />
                {errors.name ? <FormHelperText>{errors.name.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <FormControl error={Boolean(errors.phone)}>
                <InputLabel
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': { color: PrimaryColor },
                  }}
                >
                  Phone number
                </InputLabel>
                <OutlinedInput
                  {...field}
                  label="Phone number"
                  type="tel"
                  sx={{
                    input: { color: '#fff' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                  }}
                />
                {errors.phone ? <FormHelperText>{errors.phone.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          <Controller
            control={control}
            name="password"
            render={({ field }) => (
              <FormControl error={Boolean(errors.password)}>
                <InputLabel
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': { color: PrimaryColor },
                  }}
                >
                  Password
                </InputLabel>
                <OutlinedInput
                  {...field}
                  label="Password"
                  type="password"
                  sx={{
                    input: { color: '#fff' },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: PrimaryColor,
                    },
                  }}
                />
                {errors.password ? <FormHelperText>{errors.password.message}</FormHelperText> : null}
              </FormControl>
            )}
          />
          {errors.root ? <Alert color="error">{errors.root.message}</Alert> : null}
          <Button
            disabled={isPending}
            type="submit"
            variant="outlined"
            sx={{
              width: '50%',
              borderRadius: 999,
              px: 3,
              textTransform: 'none',
              bgcolor: '#000',
              color: '#FFF',
              borderColor: PrimaryColor,
              '&:hover': {
                bgcolor: PrimaryColor,
                borderColor: PrimaryColor,
                color: '#FFF',
              },
            }}
          >
            Sign up
          </Button>
        </Stack>
      </form>
    </Stack>
  );
}
