<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $guarded = [];

    public function laptops()
    {
        return $this->hasMany(Laptop::class);
    }
}
